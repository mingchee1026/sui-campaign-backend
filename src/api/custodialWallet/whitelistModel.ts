import mongoose from "mongoose";

const WhiteListSchema = new mongoose.Schema({
  campaign_id: {
    type: String,
    require: true,
    index: true,
  },
  address: {
    type: String,
    require: true,
    index: true,
  },
  permission: {
    type: Boolean,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the White List model
export const WhiteList = mongoose.model("whitelists", WhiteListSchema);
