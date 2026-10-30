const mongoose = require("mongoose");

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI must be set");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("connection successful to database");
  } catch (error) {
    console.error("connection failed:", error.name || "Error");
    process.exit(1);
  }
};

module.exports = connectDb;
