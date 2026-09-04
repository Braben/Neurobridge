const isProduction = process.env.NODE_ENV === "production";

const cookieSameSite = process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax");

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction || cookieSameSite === "none",
  sameSite: cookieSameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearRefreshTokenCookieOptions = {
  httpOnly: true,
  secure: refreshTokenCookieOptions.secure,
  sameSite: refreshTokenCookieOptions.sameSite,
};

module.exports = {
  clearRefreshTokenCookieOptions,
  refreshTokenCookieOptions,
};
