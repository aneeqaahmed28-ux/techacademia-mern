const express = require("express");
const adminController = require("../controllers/admin-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const adminMiddleware = require("../middlewares/admin-middleware");
const validate = require("../middlewares/validate-middleware");
const { updateUserSchema } = require("../validators/auth-validators");
const asyncHandler = require("../utils/async-handler");

const router = express.Router();

router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.getAllUsers)
);
router.get(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.getUserByID)
);
router.patch(
  "/users/update/:id",
  authMiddleware,
  adminMiddleware,
  validate(updateUserSchema),
  asyncHandler(adminController.updateUserByID)
);
router.delete(
  "/users/delete/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.deleteUserByID)
);
router.get(
  "/contacts",
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.getAllContacts)
);
router.delete(
  "/contacts/delete/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.deleteContactByID)
);
router.get(
  "/audit",
  authMiddleware,
  adminMiddleware,
  asyncHandler(adminController.getAuditLogs)
);

module.exports = router;
