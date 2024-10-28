import { logger } from "@/server";
import { SuiEvent } from "@mysten/sui/client";
import {
  CampaignEvent,
  ReferralCreated,
  ActivityCreated,
} from "@/api/event/eventInterface";

// Handles all events emitted by the `campaign` module.
export const handleEventObjects = async (events: SuiEvent[], type: string) => {
  for (const event of events) {
    if (!event.type.startsWith(type))
      throw new Error("Invalid event module origin");
    const data = event.parsedJson as CampaignEvent;
    logger.info(data);
  }

  //  As part of the demo and to avoid having external dependencies, we use SQLite as our database.
  // 	Prisma + SQLite does not support bulk insertion & conflict handling, so we have to insert these 1 by 1
  // 	(resulting in multiple round-trips to the database).
  //  Always use a single `bulkInsert` query with proper `onConflict` handling in production databases (e.g Postgres)
  //   const promises = Object.values(updates).map((update) =>
  //     prisma.locked.upsert({
  //       where: {
  //         objectId: update.objectId,
  //       },
  //       create: {
  //         ...update,
  //       },
  //       update,
  //     })
  //   );
  //   await Promise.all(promises);
};
