import mongoose from "mongoose";

const ReferralEventSchema = new mongoose.Schema({
  campaign_id: {
    type: String,
    require: true,
    index: true,
  },
  referrer: {
    type: String,
    require: true,
    index: true,
  },
  referee: {
    type: String,
    require: true,
    index: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Create the Referral Event model
export const ReferralEvent = mongoose.model(
  "referralEvents",
  ReferralEventSchema
);
