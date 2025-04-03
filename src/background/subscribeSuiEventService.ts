import {
  EventId,
  SuiClient,
  SuiHTTPTransport,
  Unsubscribe,
  getFullnodeUrl,
} from "@mysten/sui/client";
import { EventRepository } from "@/api/event/eventRepository";
import { logger } from "@/server";

Object.assign(global, { WebSocket: require("ws") });

class SubscribeSuiEventService {
  private eventRepository: EventRepository;
  private suiClient: SuiClient;
  private unsubscribe: Unsubscribe | undefined;

  constructor(repository: EventRepository = new EventRepository()) {
    this.eventRepository = repository;
    this.suiClient = new SuiClient({
      url: getFullnodeUrl("mainnet"),
      // transport: new SuiHTTPTransport({
      //   url: getFullnodeUrl("mainnet"),
      //   websocket: {
      //     reconnectTimeout: 1000,
      //     url: "wss://rpc.mainnet.sui.io:443",
      //   },
      // }),
      // transport: new SuiHTTPTransport({
      //   url: getFullnodeUrl("mainnet"),
      //   WebSocketConstructor: WebSocket,
      // }),
    });
  }

  async onSubscribeEvent() {
    await this.pollEvents();
  }

  async unSubscribeEvent() {
    if (this.unsubscribe) {
      await this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  pollEvents = async () => {
    const packageID = process.env.PACKAGE_ADDRESS || "";
    let currentCursor = await this.eventRepository.findCusorByCampaignId(
      packageID
    ); //: EventId | null | undefined = null;
    const POLLING_INTERVAL_MS = 3000;
    const LOGIN_EVENT = `${packageID}::campaign::LoginEvent`;
    const REFER_EVENT = `${packageID}::campaign::ReferralEvent`;

    while (true) {
      try {
        const { data, hasNextPage, nextCursor }: any =
          await this.suiClient.queryEvents({
            cursor: currentCursor || null,
            limit: 100,
            order: "ascending",
            query: {
              MoveEventModule: {
                module: "campaign",
                package: packageID,
              },
            },
          });

        if (data.length > 0) {
          let activityEvents = [];
          let referalEvents = [];
          for (const eventData of data) {
            const event = eventData.parsedJson;
            if (eventData.type === LOGIN_EVENT) {
              activityEvents.push({
                campaign_id: packageID,
                user: event.user,
                created_at: event.loggedin_at,
              });
            } else if (eventData.type === REFER_EVENT) {
              referalEvents.push({
                campaign_id: packageID,
                referrer: event.referrer,
                referee: event.referee,
                created_at: event.loggedin_at,
              });
            }
          }

          if (activityEvents.length > 0) {
            logger.info(`---- LOGIN EVENTS: ${activityEvents.length}`);
            await this.eventRepository.addActivityEvents(activityEvents);
          }

          if (referalEvents.length > 0) {
            logger.info(`---- REFER EVENTS: ${referalEvents.length}`);
            await this.eventRepository.addReferralEvents(referalEvents);
          }

          if (nextCursor) {
            await this.eventRepository.saveEventCursor(packageID, nextCursor);
            currentCursor = nextCursor;
          }
        }

        if (!hasNextPage) {
          await new Promise((resolve) =>
            setTimeout(resolve, POLLING_INTERVAL_MS)
          );
        }
      } catch (err) {
        console.error("Error polling deposit events:", err);
        console.log(`Retrying in ${POLLING_INTERVAL_MS}ms...`);
        await new Promise((resolve) =>
          setTimeout(resolve, POLLING_INTERVAL_MS)
        );
      }
    }
  };
}

export const subscribeSuiEventService = new SubscribeSuiEventService();
