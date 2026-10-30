const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized, token not provided" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. User not an admin." });
  }
  return next();
};

module.exports = adminMiddleware;
