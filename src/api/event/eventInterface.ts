export type CampaignEvent = ReferralCreated | ActivityCreated;

export type ReferralCreated = {
  referrer: string;
  referee: string;
  created_at: string;
};

export type ActivityCreated = {
  user: string;
  loggedin_at: string;
};

export interface IEventCursor {
  event_id: string;
  event_seq: string;
  tx_digest: string;
}
