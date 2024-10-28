import { ServiceResponse } from "@/common/models/serviceResponse";
import { ReferralEvent } from "./referralEventModel";
import { ActivityEvent } from "./activityEventModel";
import { EventCursor } from "./eventCursorModel";
import {
  CampaignEvent,
  ReferralCreated,
  ActivityCreated,
  IEventCursor,
} from "@/api/event/eventInterface";

export class EventRepository {
  async createReferralEvent(referralEvent: CampaignEvent) {
    const event = new ReferralEvent(referralEvent);
    const result = await event.save();
    return result;
  }

  async createActivityEvent(activityEvent: CampaignEvent) {
    const event = new ActivityEvent(activityEvent);
    const result = await event.save();
    return result;
  }

  async findReferralEventById(id: string): Promise<CampaignEvent | null> {
    const event = (await ReferralEvent.findOne({ id })) as CampaignEvent;
    return event;
  }

  async findActivityEventById(id: string): Promise<CampaignEvent | null> {
    const event = (await ActivityEvent.findOne({ id })) as CampaignEvent;
    return event;
  }

  async createEventCursor(cursor: IEventCursor) {
    return await EventCursor.findOneAndUpdate(
      { event_id: cursor.event_id }, // Search for cusor by event_id
      { event_seq: cursor.event_seq, tx_digest: cursor.tx_digest }, // Update seq and digest
      { new: true, upsert: true } // Create if not found
    );
  }

  async findCusorByType(event_id: string) {
    const cursor = await EventCursor.findOne({ event_id });
    return cursor;
  }
}
