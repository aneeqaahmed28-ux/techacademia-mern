const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    return next();
  } catch (err) {
    const issue = err.issues?.[0] || err.errors?.[0];
    return next({
      status: 422,
      message: "Fill the input properly",
      extraDetails: issue?.message || "Invalid input",
    });
  }
};

module.exports = validate;
