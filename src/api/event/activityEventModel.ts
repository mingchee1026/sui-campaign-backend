import mongoose from "mongoose";

const ActivityEventSchema = new mongoose.Schema({
  campaign_id: {
    type: String,
    require: true,
    index: true,
  },
  user: {
    type: String,
    require: true,
    index: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Create the Activity Event model
export const ActivityEvent = mongoose.model(
  "activityEvents",
  ActivityEventSchema
);
