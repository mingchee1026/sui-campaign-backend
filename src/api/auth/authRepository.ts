import { GetSaltRequest, GetSaltResponse } from "./authInterface";
import { Salt } from "./saltModel";
import { logger } from "@/server";

export class AuthRepository {
  async findSaltBySubjectAsync(subject: string): Promise<GetSaltResponse> {
    let salt: string | null = null;
    try {
      const saltRow = await Salt.findOne({ subject });
      return { subject, salt: saltRow!.salt! };
    } catch (error) {
      const errorMessage = error as Error;
      if (errorMessage.message.includes("WRONGTYPE")) {
        //We recently refactored KV store to use hash set instead of set.
        //This error means that the key is an old entry and not a hash set. We should delete it from KV store.
        logger.error("WRONGTYPE error. Deleting key from KV store.");
        // kv.del(dataRequest.subject);
        return { subject, salt: salt! };
      }
    }
    return { subject, salt: salt! };
  }

  async saveSaltAsync(subject: string, salt: string): Promise<GetSaltResponse> {
    try {
      const newSalt = new Salt({ subject, salt });
      const result = await newSalt.save();
      return { subject, salt };
    } catch (error) {
      const errorMessage = error as Error;
      if (errorMessage.message.includes("WRONGTYPE")) {
        //We recently refactored KV store to use hash set instead of set.
        //This error means that the key is an old entry and not a hash set. We should delete it from KV store.
        logger.error("WRONGTYPE error. Deleting key from database.");
        // kv.del(dataRequest.subject);
        return { subject, salt: salt! };
      }
    }
    return { subject, salt: salt! };
  }
}
