import { EventId } from "@mysten/sui/client";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { ReferralEvent } from "./referralEventModel";
import { ActivityEvent } from "./activityEventModel";
import { EventCursor } from "./eventCursorModel";
import {
  CreateReferralEvent,
  CreateActivityEvent,
  IEventCursor,
} from "@/api/event/eventInterface";

export class EventRepository {
  async addReferralEvents(referralEvents: CreateReferralEvent[]) {
    const event = new ReferralEvent(referralEvents);
    await ReferralEvent.insertMany(referralEvents);
  }

  async addActivityEvents(activityEvents: CreateActivityEvent[]) {
    const event = new ActivityEvent(activityEvents);
    await ActivityEvent.insertMany(activityEvents);
  }

  async findReferralEventById(id: string): Promise<CreateReferralEvent | null> {
    const event = (await ReferralEvent.findOne({ id })) as CreateReferralEvent;
    return event;
  }

  async findActivityEventById(id: string): Promise<CreateActivityEvent | null> {
    const event = (await ActivityEvent.findOne({ id })) as CreateActivityEvent;
    return event;
  }

  async saveEventCursor(campaignId: string, cursor: EventId) {
    return await EventCursor.findOneAndUpdate(
      { campaign_id: campaignId }, // Search for cusor by event_id
      { event_seq: cursor.eventSeq, tx_digest: cursor.txDigest }, // Update seq and digest
      { new: true, upsert: true } // Create if not found
    );
  }

  async findCusorByCampaignId(campaignId: string) {
    const cursor = await EventCursor.findOne({ campaign_id: campaignId });
    if (cursor) {
      return {
        txDigest: cursor.tx_digest!,
        eventSeq: cursor.event_seq!,
      };
    }

    return null;
  }
}
