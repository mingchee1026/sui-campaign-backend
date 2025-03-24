import mongoose from "mongoose";

const EventCursorSchema = new mongoose.Schema({
  campaign_id: {
    type: String,
    require: true,
    index: true,
  },
  event_id: {
    type: String,
    index: true,
  },
  event_seq: {
    type: String,
    require: true,
    index: true,
  },
  tx_digest: {
    type: String,
    require: true,
  },
});

// Create the Event Cursor model
export const EventCursor = mongoose.model("eventCursor", EventCursorSchema);
