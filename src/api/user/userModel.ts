import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  campaign_id: {
    type: String,
    require: true,
    index: true,
  },
  subject: {
    type: String,
    require: true,
    index: true,
  },
  email: {
    type: String,
    require: true,
    index: true,
  },
  salt: {
    type: String,
  },
  wallet_address: {
    type: String,
    require: true,
    index: true,
  },
  custodial_address: {
    type: String,
    require: true,
    index: true,
  },
  attribution_code: {
    type: String,
    require: true,
    index: true,
  },
  referred_by: {
    type: String,
    require: true,
    index: true,
  },
  user_name: {
    type: String,
    require: true,
  },
  avatar: {
    type: String,
    require: true,
  },
  jwt: {
    type: {},
  },
  publicKey: {
    type: String,
    require: true,
    index: true,
  },
  signature: {
    type: String,
    require: true,
    index: true,
  },
  context: {
    type: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the User model
export const User = mongoose.model("user", UserSchema);
