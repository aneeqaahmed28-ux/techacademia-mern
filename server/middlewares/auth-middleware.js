const User = require("../models/user-model");
const { verifyAccessToken } = require("../utils/tokens");

const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized, token not provided" });
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded?.userId) {
      return res.status(401).json({ message: "Unauthorized, invalid token." });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized, invalid token." });
    }

    if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      return res.status(401).json({ message: "Unauthorized, invalid token." });
    }

    req.user = user;
    req.token = token;
    req.userID = user._id;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Unauthorized, invalid token." });
  }
};

module.exports = authMiddleware;
