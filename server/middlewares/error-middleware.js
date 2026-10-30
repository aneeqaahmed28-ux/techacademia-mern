const errorMiddleware = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let status = Number(err.status) || 500;
  let message = err.message || "Backend Error";
  const extraDetails = err.extraDetails;

  if (err.name === "CastError" || err.name === "BSONError") {
    status = 400;
    message = "Invalid id";
  }

  if (err.code === 11000) {
    status = 409;
    message = "A record with that value already exists";
  }

  if (status >= 500) {
    console.error(err);
    message = "Internal server error";
  }

  const body = { message };
  if (extraDetails && status < 500) {
    body.extraDetails = extraDetails;
  }

  return res.status(status).json(body);
};

module.exports = errorMiddleware;
