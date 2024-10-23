import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema({
  package_id: {
    type: String,
    require: true,
    index: true,
  },
  admin_cap_id: {
    type: String,
    require: true,
    index: true,
  },
  secret_id: {
    type: String,
    require: true,
    index: true,
  },
  campaign_id: {
    type: String,
    require: true,
    index: true,
  },
  title: {
    type: String,
    require: true,
    index: true,
  },
  about: {
    type: String,
    require: true,
  },
  active: {
    type: Boolean,
    require: true,
  },
  started_at: {
    type: Date,
    require: true,
    default: Date.now,
  },
  ended_at: {
    type: Date,
    require: true,
  },
});

// Create the User model
export const Campaign = mongoose.model("campaign", CampaignSchema);
