export type CampaignEvent = CreateReferralEvent | CreateActivityEvent;

export type CreateReferralEvent = {
  referrer: string;
  referee: string;
  created_at: string;
};

export type CreateActivityEvent = {
  user: string;
  created_at: string;
};

export interface IEventCursor {
  event_id: string;
  event_seq: string;
  tx_digest: string;
}
