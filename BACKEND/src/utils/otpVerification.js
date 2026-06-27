import bcrypt from "bcryptjs";
import OTP from "../models/otp.model.js";

/**
 * Looks up the active OTP record for an identifier/purpose, enforces the
 * attempt limit, checks the supplied code against the stored hash, and
 * marks the record verified on success.
 *
 * Throws a plain Error on any failure (caller's catch block decides the
 * HTTP status — typically 400/429 for these cases). On success, returns the
 * (now-verified) OTP record so the caller can delete it once signup/reset
 * has fully completed.
 *
 * Does NOT delete the record itself — deletion happens after the
 * dependent operation (user creation, password reset, etc.) succeeds,
 * so a failure partway through doesn't burn a valid OTP.
 */
export const verifyOTPRecord = async ({ identifier, otp, purpose, userType }) => {
    const query = { identifier, purpose, expiresAt: { $gt: new Date() } };
    if (userType) {
        query.userType = userType;
    }

    const otpRecord = await OTP.findOne(query);

    if (!otpRecord) {
        throw new Error("OTP expired or not found. Please request a new OTP.");
    }

    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new Error("Too many failed attempts. Please request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new Error(`Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return otpRecord;
};