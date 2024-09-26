import mongoose from "mongoose";

const CustodialWalletSchema = new mongoose.Schema({
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

// Create the Custodial Wallet model
export const CustodialWallet = mongoose.model("custodialWallets", CustodialWalletSchema);
