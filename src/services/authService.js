const bcrypt       = require('bcrypt');
const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCESS_EXPIRY      = '15m';
const REFRESH_EXPIRY     = '7d';
const REFRESH_EXPIRY_MS  = 7 * 24 * 60 * 60 * 1000;

// Refresh token should use its own secret so a leaked AT secret can't forge RTs
const rtSecret = () => process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

// ── Token helpers ─────────────────────────────────────────────────────────────

const signAccessToken = (userId) =>
    jwt.sign({ id: String(userId) }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });

const signRefreshToken = (userId) =>
    jwt.sign({ id: String(userId) }, rtSecret(), { expiresIn: REFRESH_EXPIRY });

const persistRefreshToken = (userId, token) =>
    RefreshToken.create({
        userId,
        token,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    });

// ── Public API ────────────────────────────────────────────────────────────────

const registerUser = async ({ name, email, password }) => {
    const existing = await User.findOne({ email });
    if (existing) throw new Error('User already exists');

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed });

    return { _id: user._id, name: user.name, email: user.email };
};

const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error('Invalid credentials');

    const accessToken  = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    await persistRefreshToken(user._id, refreshToken);

    return {
        user: { _id: user._id, name: user.name, email: user.email },
        accessToken,
        refreshToken,
    };
};

const rotateRefreshToken = async (incomingToken) => {
    // Step 1 — verify signature and expiry
    let payload;
    try {
        payload = jwt.verify(incomingToken, rtSecret());
    } catch {
        const err = new Error('Invalid or expired refresh token');
        err.status = 401;
        throw err;
    }

    // Step 2 — confirm token exists in DB (proves it hasn't been rotated away)
    const stored = await RefreshToken.findOne({ token: incomingToken });
    if (!stored) {
        // Token was already rotated: potential replay attack.
        // Wipe every session for this user as a defensive measure.
        await RefreshToken.deleteMany({ userId: payload.id });
        const err = new Error('Refresh token reuse detected — all sessions have been revoked');
        err.status = 403;
        throw err;
    }

    // Step 3 — atomic rotation: delete old, issue new pair
    await RefreshToken.deleteOne({ _id: stored._id });

    const newAccessToken  = signAccessToken(payload.id);
    const newRefreshToken = signRefreshToken(payload.id);

    await persistRefreshToken(payload.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const revokeRefreshToken = async (token) => {
    if (token) await RefreshToken.deleteOne({ token });
};

const revokeAllRefreshTokens = async (userId) => {
    await RefreshToken.deleteMany({ userId });
};

module.exports = {
    registerUser,
    loginUser,
    rotateRefreshToken,
    revokeRefreshToken,
    revokeAllRefreshTokens,
};
