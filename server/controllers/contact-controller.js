const Contact = require("../models/contact-model");

const contactForm = async (req, res, next) => {
  try {
    const { username, email, message } = req.body;
    await Contact.create({ username, email, message });
    return res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = contactForm;
