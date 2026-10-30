const HttpError = require("./http-error");

function asQueryString(value) {
  if (typeof value !== "string") {
    throw new HttpError(400, "Invalid input");
  }
  return value;
}

module.exports = { asQueryString };
