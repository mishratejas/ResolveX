import bcrypt from "bcryptjs";
import { ApiError } from "./ApiError.js";
import OTP from "../models/otp.model.js";

/**
 * Looks up the active OTP record for an identifier/purpose, enforces the
 * attempt limit, checks the supplied code against the stored hash, and
 * marks the record verified on success.
 *
 * Throws ApiError (400/429) on any failure. On success, returns the
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
        throw new ApiError(400, "OTP expired or not found. Please request a new OTP.");
    }

    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        throw new ApiError(400, `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`);
    }

    otpRecord.verified = true;
    await otpRecord.save();

    return otpRecord;
};