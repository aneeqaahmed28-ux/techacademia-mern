const express = require ("express");
const router = express.Router();
const authcontroller = require("../controllers/auth-controller");
const validate = require ("../middlewares/validate-middleware");
const {signupSchema, loginSchema}= require ("../validators/auth-validators");
const authMiddleware = require("../middlewares/auth-middleware");

router.route("/").get(authcontroller.home);
router.route("/register").post(validate(signupSchema), authcontroller.register);
router.route("/login").post(validate(loginSchema),authcontroller.login);
//router.route("/user").get( authcontroller.user);
 router.route("/user").get(authMiddleware, authcontroller.user);
module.exports = router;