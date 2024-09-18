import mongoose from "mongoose";

const CustodialAddressSchema = new mongoose.Schema({
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
  address: {
    type: String,
    require: true,
    index: true,
  },
  secretKey: {
    type: String,
    require: true,
  },
  publicKey: {
    type: Object,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Custodial Address model
export const CustodialAddress = mongoose.model("custodialAddress", CustodialAddressSchema);
