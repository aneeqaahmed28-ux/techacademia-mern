const { Schema, model } = require("mongoose");

const contactSchema = new Schema(
  {
    username: { type: String, required: true, maxlength: 255 },
    email: { type: String, required: true, maxlength: 255 },
    message: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const Contact = model("Contact", contactSchema);
module.exports = Contact;
