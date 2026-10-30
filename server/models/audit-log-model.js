const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["USER_UPDATE", "USER_DELETE", "CONTACT_DELETE"],
    },
    targetType: {
      type: String,
      required: true,
      enum: ["User", "Contact"],
    },
    targetId: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
module.exports = AuditLog;
