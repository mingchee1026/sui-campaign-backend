import { EnokiClient } from "@mysten/enoki";

export const enokiClient = new EnokiClient({
  apiKey: process.env.ENOKI_PRIVATE_API_KEY!,
});
