import mongoose from "mongoose";

const SaltSchema = new mongoose.Schema({
  subject: {
    type: String,
    require: true,
    index: true,
  },
  salt: {
    type: String,
    require: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Salt model
export const Salt = mongoose.model("salt", SaltSchema);
