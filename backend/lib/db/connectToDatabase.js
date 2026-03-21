const mongoose = require("mongoose");

async function connectToDatabase() {
  const mongoDbUrl = process.env.MONGODB_URL || process.env.MONGODB_URI;

  if (!mongoDbUrl) {
    console.error(
      "No MongoDB url provided. Make sure there is a MONGODB_URL or MONGODB_URI environment variable set. See the README for more details."
    );
    throw new Error("No connection string provided");
  }

  // In tests, only allow explicit local Mongo targets.
  if (
    process.env.NODE_ENV === "test" &&
    !/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\//.test(mongoDbUrl)
  ) {
    throw new Error(
      "Refusing to run tests against a non-local MongoDB instance."
    );
  }

  await mongoose.connect(mongoDbUrl);

  if (process.env.NODE_ENV !== "test") {
    console.log("Successfully connected to MongoDB");
  }
}

module.exports = { connectToDatabase };
