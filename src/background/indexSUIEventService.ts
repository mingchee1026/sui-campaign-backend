import {
  EventId,
  SuiClient,
  SuiEvent,
  SuiEventFilter,
  getFullnodeUrl,
} from "@mysten/sui/client";
import { handleEventObjects } from "./eventHandler";
import { EventRepository } from "@/api/event/eventRepository";
import { logger } from "@/server";

type SuiEventsCursor = EventId | null | undefined;

type EventExecutionResult = {
  cursor: SuiEventsCursor;
  hasNextPage: boolean;
};

type EventTracker = {
  // The module that defines the type, with format `package::module`
  type: string;
  filter: SuiEventFilter;
  callback: (events: SuiEvent[], type: string) => any;
};

const EVENTS_TO_TRACK: EventTracker[] = [
  {
    // type: `${process.env.PACKAGE_ADDRESS}::${process.env.CAMPAIGN_OBJECT_ADDRESS}::campaign`,
    type: `${process.env.PACKAGE_ADDRESS}::campaign`,
    filter: {
      MoveEventModule: {
        module: "campaign",
        package: process.env.PACKAGE_ADDRESS!,
      },
      // MoveModule: {
      //   module: "campaign",
      //   package: process.env.PACKAGE_ADDRESS!,
      // },
    },
    callback: handleEventObjects,
  },
];

class IndexSUIEventService {
  private suiClient: SuiClient;
  private repository: EventRepository;

  constructor(repository: EventRepository = new EventRepository()) {
    this.suiClient = new SuiClient({
      url: getFullnodeUrl("mainnet"),
      // url: getFullnodeUrl("testnet"),
    });

    this.repository = repository;
  }

  /// Sets up all the listeners for the events we want to track.
  /// They are polling the RPC endpoint every second.
  setupListeners = async () => {
    for (const event of EVENTS_TO_TRACK) {
      this.runEventJob(
        this.suiClient,
        event,
        await this.getLatestCursor(event)
      );
    }
  };

  private executeEventJob = async (
    client: SuiClient,
    tracker: EventTracker,
    cursor: SuiEventsCursor
  ): Promise<EventExecutionResult> => {
    try {
      // get the events from the chain.
      // For this implementation, we are going from start to finish.
      // This will also allow filling in a database from scratch!
      const { data, hasNextPage, nextCursor } = await client.queryEvents({
        query: tracker.filter,
        cursor,
        order: "ascending",
      });

      logger.info(data.length);
      logger.info(hasNextPage);
      logger.info(nextCursor);
      logger.info("-----------------------------------------------");

      // handle the data transformations defined for each event
      // await tracker.callback(data, tracker.type);

      // We only update the cursor if we fetched extra data (which means there was a change).
      if (nextCursor && data.length > 0) {
        await this.saveLatestCursor(tracker, nextCursor);

        return {
          cursor: nextCursor,
          hasNextPage,
        };
      }
    } catch (error: any) {
      logger.error(error);
    }
    // By default, we return the same cursor as passed in.
    return {
      cursor,
      hasNextPage: false,
    };
  };

  private runEventJob = async (
    client: SuiClient,
    tracker: EventTracker,
    cursor: SuiEventsCursor
  ) => {
    const result = await this.executeEventJob(client, tracker, cursor);

    // Trigger a timeout. Depending on the result, we either wait 0ms or the polling interval.
    setTimeout(
      () => {
        this.runEventJob(client, tracker, result.cursor);
      },
      result.hasNextPage
        ? 0
        : parseInt(process.env.EVENT_POLLING_INTERVAL_MS || "0")
    );
  };

  /**
   * Gets the latest cursor for an event tracker, either from the DB (if it's undefined)
   *  or from the running cursors.
   */
  private getLatestCursor = async (tracker: EventTracker) => {
    const cursor = await this.repository.findCusorByType(tracker.type);
    if (cursor) {
      return {
        eventSeq: cursor.event_seq,
        txDigest: cursor.tx_digest,
      } as EventId;
    }

    return undefined;
  };

  /**
   * Saves the latest cursor for an event tracker to the db, so we can resume
   * from there.
   * */
  private saveLatestCursor = async (tracker: EventTracker, cursor: EventId) => {
    const data = {
      event_id: tracker.type,
      event_seq: cursor.eventSeq,
      tx_digest: cursor.txDigest,
    };

    return this.repository.createEventCursor(data);
  };
}

export const indexSUIEventService = new IndexSUIEventService();
