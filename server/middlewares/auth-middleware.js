const jwt = require("jsonwebtoken");
const User = require("../models/user-model");


//to check wheather user has token or not
const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    console.log("token not found");
    return res.status(401).json({ msg: "Unauthorized HTTP, Token not provided" });
  }

  const jwtToken = token.replace("Bearer", "").trim();

  try {
    const isVerified = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
    const userData = await User.findOne({ email: isVerified.email }).select({
      password: 0,
    });
    //console.log("token from auth-middleware", userData);
    req.user = userData;
    req.token = token;
    req.userID = userData._id;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Unauthorized, invalid token." });
  }
};
module.exports = authMiddleware;
