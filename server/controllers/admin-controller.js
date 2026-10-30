const User = require("../models/user-model");
const Contact = require("../models/contact-model");
const RefreshToken = require("../models/refresh-token-model");
const AuditLog = require("../models/audit-log-model");
const HttpError = require("../utils/http-error");
const { publicUser } = require("../utils/public-user");
const { isObjectId } = require("../utils/object-id");
const { recordAudit } = require("../utils/audit");

const getAllUsers = async (_req, res, next) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json(users.map(publicUser));
  } catch (error) {
    return next(error);
  }
};

const getUserByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isObjectId(id)) {
      return next(new HttpError(400, "Invalid id"));
    }
    const user = await User.findById(id).select("-password");
    if (!user) {
      return next(new HttpError(404, "User not found"));
    }
    return res.status(200).json(publicUser(user));
  } catch (error) {
    return next(error);
  }
};

const updateUserByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isObjectId(id)) {
      return next(new HttpError(400, "Invalid id"));
    }

    const update = {
      username: req.body.username,
      email:
        typeof req.body.email === "string" ? req.body.email.toLowerCase() : req.body.email,
      phone: req.body.phone,
    };

    const updated = await User.findOneAndUpdate(
      { _id: id },
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) {
      return next(new HttpError(404, "User not found"));
    }

    await recordAudit(req, {
      action: "USER_UPDATE",
      targetType: "User",
      targetId: id,
      metadata: { fields: ["username", "email", "phone"] },
    });

    return res.status(200).json({
      message: "User updated",
      userData: publicUser(updated),
    });
  } catch (error) {
    return next(error);
  }
};

const deleteUserByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isObjectId(id)) {
      return next(new HttpError(400, "Invalid id"));
    }
    if (req.user._id.toString() === id) {
      return next(new HttpError(400, "You cannot delete your own account while signed in"));
    }

    const deleted = await User.deleteOne({ _id: id });
    if (!deleted.deletedCount) {
      return next(new HttpError(404, "User not found"));
    }

    await RefreshToken.deleteMany({ user: id });
    await recordAudit(req, {
      action: "USER_DELETE",
      targetType: "User",
      targetId: id,
    });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const getAllContacts = async (_req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json(contacts);
  } catch (error) {
    return next(error);
  }
};

const deleteContactByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isObjectId(id)) {
      return next(new HttpError(400, "Invalid id"));
    }
    const deleted = await Contact.deleteOne({ _id: id });
    if (!deleted.deletedCount) {
      return next(new HttpError(404, "Contact not found"));
    }
    await recordAudit(req, {
      action: "CONTACT_DELETE",
      targetType: "Contact",
      targetId: id,
    });
    return res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const getAuditLogs = async (_req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).select("-__v");
    return res.status(200).json(logs);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllUsers,
  getAllContacts,
  deleteUserByID,
  getUserByID,
  updateUserByID,
  deleteContactByID,
  getAuditLogs,
};
