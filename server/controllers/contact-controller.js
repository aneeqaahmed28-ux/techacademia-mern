const Contact = require("../models/contact-model");
const { asQueryString } = require("../utils/as-string");

const contactForm = async (req, res, next) => {
  try {
    const username = asQueryString(req.body.username);
    const email = asQueryString(req.body.email);
    const message = asQueryString(req.body.message);
    await Contact.create({ username, email, message });
    return res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = contactForm;
