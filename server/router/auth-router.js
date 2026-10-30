const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth-controller");
const validate = require("../middlewares/validate-middleware");
const { signupSchema, loginSchema } = require("../validators/auth-validators");
const authMiddleware = require("../middlewares/auth-middleware");
const asyncHandler = require("../utils/async-handler");
const { createAuthLimiter } = require("../middlewares/rate-limit");

const authLimiter = createAuthLimiter();

router.get("/", asyncHandler(authController.home));
router.post(
  "/register",
  authLimiter,
  validate(signupSchema),
  asyncHandler(authController.register)
);
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.get("/user", authMiddleware, asyncHandler(authController.user));

module.exports = router;
