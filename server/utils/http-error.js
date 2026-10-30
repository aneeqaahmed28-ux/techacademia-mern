class HttpError extends Error {
  constructor(status, message, extraDetails) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    if (extraDetails) {
      this.extraDetails = extraDetails;
    }
  }
}

module.exports = HttpError;
