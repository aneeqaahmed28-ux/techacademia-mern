const express = require("express");
const router = express.Router();
const contactForm = require("../controllers/contact-controller");
const validate = require("../middlewares/validate-middleware");
const { contactSchema } = require("../validators/auth-validators");
const asyncHandler = require("../utils/async-handler");
const { createAuthLimiter } = require("../middlewares/rate-limit");

const contactLimiter = createAuthLimiter({
  max: Number(process.env.RATE_LIMIT_CONTACT_MAX) || 20,
});

router.post(
  "/contact",
  contactLimiter,
  validate(contactSchema),
  asyncHandler(contactForm)
);

module.exports = router;
