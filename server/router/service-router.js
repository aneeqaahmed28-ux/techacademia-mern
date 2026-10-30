const express = require("express");
const router = express.Router();
const services = require("../controllers/service-controller");
const asyncHandler = require("../utils/async-handler");

router.get("/services", asyncHandler(services));

module.exports = router;
