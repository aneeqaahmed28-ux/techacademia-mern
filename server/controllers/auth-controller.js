const User = require("../models/user-model");
const RefreshToken = require("../models/refresh-token-model");
const { publicUser } = require("../utils/public-user");
const { compareWithDummy, warmDummyHash } = require("../utils/passwords");
const {
  signAccessToken,
  newRefreshToken,
  hashToken,
  refreshTtlMs,
} = require("../utils/tokens");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookies");
const { asQueryString } = require("../utils/as-string");

warmDummyHash();

async function issueSession(req, res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = newRefreshToken();
  const csrfToken = newRefreshToken();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + refreshTtlMs()),
    userAgent: (req.get("user-agent") || "").slice(0, 200),
    ip: req.ip,
  });
  setAuthCookies(res, { accessToken, refreshToken, csrfToken });
  return csrfToken;
}

const home = async (_req, res) => {
  res.status(200).json({ message: "welcome to our home page" });
};

const register = async (req, res, next) => {
  try {
    const username = asQueryString(req.body.username);
    const email = asQueryString(req.body.email);
    const phone = asQueryString(req.body.phone);
    const password = asQueryString(req.body.password);
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    const user = await User.create({
      username,
      email,
      phone,
      password,
      isAdmin: false,
    });
    const csrfToken = await issueSession(req, res, user);
    return res.status(201).json({
      message: "Registration Successful",
      userId: user._id.toString(),
      userData: publicUser(user),
      csrfToken,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const email = asQueryString(req.body.email);
    const password = asQueryString(req.body.password);
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      await compareWithDummy(password);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const csrfToken = await issueSession(req, res, user);
    return res.status(200).json({
      message: "Login Successful",
      userId: user._id.toString(),
      userData: publicUser(user),
      csrfToken,
    });
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const raw = req.cookies?.refreshToken;
    if (!raw || typeof raw !== "string") {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Unauthorized, invalid token." });
    }

    const nextRaw = newRefreshToken();
    const nextHash = hashToken(nextRaw);
    const record = await RefreshToken.findOneAndUpdate(
      {
        tokenHash: hashToken(raw),
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { revokedAt: new Date(), replacedBy: nextHash } },
      { new: false }
    );

    if (!record) {
      const existing = await RefreshToken.findOne({ tokenHash: hashToken(raw) });
      if (existing?.revokedAt) {
        await RefreshToken.updateMany(
          { user: existing.user, revokedAt: null },
          { $set: { revokedAt: new Date() } }
        );
      }
      clearAuthCookies(res);
      return res.status(401).json({ message: "Unauthorized, invalid token." });
    }

    const user = await User.findById(record.user);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Unauthorized, invalid token." });
    }

    await RefreshToken.create({
      user: user._id,
      tokenHash: nextHash,
      expiresAt: new Date(Date.now() + refreshTtlMs()),
      userAgent: (req.get("user-agent") || "").slice(0, 200),
      ip: req.ip,
    });
    const csrfToken = newRefreshToken();
    setAuthCookies(res, {
      accessToken: signAccessToken(user),
      refreshToken: nextRaw,
      csrfToken,
    });
    return res.status(200).json({
      message: "Token refreshed",
      userData: publicUser(user),
      csrfToken,
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const raw = req.cookies?.refreshToken;
    if (raw && typeof raw === "string") {
      const record = await RefreshToken.findOne({ tokenHash: hashToken(raw) });
      if (record && !record.revokedAt) {
        record.revokedAt = new Date();
        await record.save();
      }
    }
    clearAuthCookies(res);
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return next(error);
  }
};

const user = async (req, res) => {
  return res.status(200).json({
    userData: publicUser(req.user),
    csrfToken: req.cookies?.csrfToken,
  });
};

module.exports = { home, register, login, refresh, logout, user };
