const mongoose = require("mongoose");

function isObjectId(id) {
  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  return new mongoose.Types.ObjectId(id).toString() === id;
}

module.exports = { isObjectId };
