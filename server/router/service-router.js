// const express = require("express");
// const services = require("../controllers/service-controller");
// const router = express.Router();

// router.route("/service").get(services);
// module.exports = router;
const express = require("express");
const router = express.Router();
const services = require("../controllers/service-controller");

router.route("/services").get(services);

module.exports = router;