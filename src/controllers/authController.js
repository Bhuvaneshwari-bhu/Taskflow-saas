const {
    registerUser,
    loginUser,
    rotateRefreshToken,
    revokeRefreshToken,
    revokeAllRefreshTokens,
} = require('../services/authService');

// ── Cookie config ─────────────────────────────────────────────────────────────

const COOKIE_NAME = 'refreshToken';

// In production the frontend and backend are on different domains, so we need
// sameSite:'none' + secure:true to allow the refresh-token cookie to be sent
// in cross-origin requests. In dev, lax is fine over HTTP.
const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = () => ({
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure:   isProd,
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path:     '/',
});

const clearCookieOptions = () => ({
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure:   isProd,
    path:     '/',
});

// ── Handlers ──────────────────────────────────────────────────────────────────

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'name, email and password are required' });
        }

        const user = await registerUser({ name, email, password });
        res.status(201).json({ success: true, user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'email and password are required' });
        }

        const { user, accessToken, refreshToken } = await loginUser({ email, password });

        res.cookie(COOKIE_NAME, refreshToken, cookieOptions());

        res.status(200).json({ success: true, user, accessToken });
    } catch (err) {
        res.status(401).json({ success: false, message: err.message });
    }
};

const refresh = async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME];

        if (!token) {
            return res.status(401).json({ success: false, message: 'No refresh token provided' });
        }

        const { accessToken, refreshToken } = await rotateRefreshToken(token);

        // Set the rotated refresh token
        res.cookie(COOKIE_NAME, refreshToken, cookieOptions());

        res.status(200).json({ success: true, accessToken });
    } catch (err) {
        // Clear the cookie on any token error (invalid, expired, reuse)
        res.clearCookie(COOKIE_NAME, clearCookieOptions());
        res.status(err.status || 401).json({ success: false, message: err.message });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.cookies[COOKIE_NAME];
        await revokeRefreshToken(token); // safe even if token is undefined
        res.clearCookie(COOKIE_NAME, clearCookieOptions());
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const logoutAll = async (req, res) => {
    try {
        // req.user is attached by the protect middleware (valid access token required)
        await revokeAllRefreshTokens(req.user);
        res.clearCookie(COOKIE_NAME, clearCookieOptions());
        res.status(200).json({ success: true, message: 'All sessions terminated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { register, login, refresh, logout, logoutAll };
