const Service = require("../models/service-model");

const services = async (_req, res, next) => {
  try {
    const rows = await Service.find();
    return res.status(200).json({ services: rows, msg: rows });
  } catch (error) {
    return next(error);
  }
};

module.exports = services;
