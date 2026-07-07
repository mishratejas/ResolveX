import jwt from "jsonwebtoken";

/**
 * Generates a short-lived access token and a long-lived refresh token
 * for the given JWT payload (e.g. { id, role, workspaceCode }).
 */
export const generateAuthTokens = (payload) => {
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1m" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

/**
 * Standard cookie options for the refresh token cookie, shared by every
 * controller that sets/clears it (user, staff, admin).
 *
 * IMPORTANT: the frontend (Vercel) and backend (Render) live on different
 * domains in production, which makes this a cross-site request from the
 * browser's point of view. `sameSite: "strict"` (and even "lax") tells the
 * browser to NOT send the cookie on cross-site requests at all, so the
 * refresh-token endpoint always saw `req.cookies.refreshToken === undefined`
 * and returned "Refresh token required" — this was the refresh bug.
 * Cross-site cookies require `sameSite: "none"` + `secure: true`.
 *
 * We used to gate this on `process.env.NODE_ENV === "production"`, but Render
 * does NOT set NODE_ENV automatically for Node web services, so in practice
 * NODE_ENV was still "development" in production and the cookie kept being
 * issued as `sameSite: "lax"` — same bug, just one layer deeper. Instead we
 * detect HTTPS directly from the incoming request (requires
 * `app.set("trust proxy", 1)` in app.js so `req.secure` correctly reflects
 * Render's `X-Forwarded-Proto` header). Locally over plain HTTP this
 * correctly falls back to `sameSite: "lax"`, which still works because
 * localhost:5173 -> localhost:5000 is same-site.
 */
export const getRefreshCookieOptions = (req) => {
    const isHttps = Boolean(req && (req.secure || req.headers?.["x-forwarded-proto"] === "https"));
    return {
        httpOnly: true,
        secure: isHttps,
        sameSite: isHttps ? "none" : "lax",
    };
};

/**
 * Sets the refresh token as an HttpOnly cookie using the project's
 * standard cookie options. Cookie name defaults to "refreshToken" (user),
 * but staff/admin signup pass "staffRefreshToken" / "adminRefreshToken"
 * so each role's refresh cookie stays separate and doesn't overwrite
 * another role's cookie in the same browser.
 */
export const setRefreshTokenCookie = (req, res, refreshToken, cookieName = "refreshToken") => {
    res.cookie(cookieName, refreshToken, {
        ...getRefreshCookieOptions(req),
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

/**
 * Convenience wrapper: generates tokens AND sets the refresh cookie in one call.
 * Returns just the accessToken, since that's what the JSON response needs.
 */
export const issueAuthTokens = (req, res, payload, cookieName = "refreshToken") => {
    const { accessToken, refreshToken } = generateAuthTokens(payload);
    setRefreshTokenCookie(req, res, refreshToken, cookieName);
    return accessToken;
};