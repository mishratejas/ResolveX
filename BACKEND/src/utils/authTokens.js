import jwt from "jsonwebtoken";

/**
 * Generates a short-lived access token and a long-lived refresh token
 * for the given JWT payload (e.g. { id, role, workspaceCode }).
 */
export const generateAuthTokens = (payload) => {
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

/**
 * Sets the refresh token as an HttpOnly cookie using the project's
 * standard cookie options.
 */
export const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

/**
 * Convenience wrapper: generates tokens AND sets the refresh cookie in one call.
 * Returns just the accessToken, since that's what the JSON response needs.
 */
export const issueAuthTokens = (res, payload) => {
    const { accessToken, refreshToken } = generateAuthTokens(payload);
    setRefreshTokenCookie(res, refreshToken);
    return accessToken;
};