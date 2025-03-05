import {
  SuiClient,
  SuiHTTPTransport,
  getFullnodeUrl,
} from "@mysten/sui/client";
import mongoose from "mongoose";

import { env } from "@/common/utils/envConfig";
import { app, logger } from "@/server";
import { subscribeSuiEventService } from "@/background/subscribeSuiEventService";
import { monitorCustodialWalletService } from "@/background/monitorCustodialWalletService";
import { indexSUIEventService } from "@/background/indexSUIEventService";

// const server = app.listen(env.PORT, () => {
//   const { NODE_ENV, HOST, PORT } = env;
//   logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);
// });

let server: any;
mongoose
  .connect(env.MONGODB_URL)
  .then(() => {
    logger.info("Connected to MongoDB.");
    server = app.listen(env.PORT, () => {
      const { NODE_ENV, HOST, PORT } = env;
      logger.info(
        `Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`
      );
    });
  })
  .catch((error: any) => {
    logger.info("Can not Connect to MongoDB.");
    process.exit();
  });

// Start custodial wallets monitoring
monitorCustodialWalletService.onStartMonitor();

// Start SUI event listener
try {
  // subscribeSuiEventService.onSubscribeEvent();
  indexSUIEventService.setupListeners();
} catch (error) {
  logger.error(error);
}

// Get IDs
const getAdminCap = async () => {
  const suiClient = new SuiClient({
    url: process.env.SUI_NETWORK || "http://localhost",
  });
  const adminCap = await suiClient
    .getOwnedObjects({
      owner: process.env.ADMIN_ADDRESS!,
      filter: {
        StructType: `${process.env.PACKAGE_ADDRESS}::campaign::AdminCap`,
      },
    })
    .then(async (resp) => {
      // console.log(resp.data);
      return resp.data.length === 0;
    });

  console.log({ adminCap });
};
/*
getAdminCap();
*/

const onCloseSignal = async () => {
  logger.info("Sigint received, shutting down.");

  monitorCustodialWalletService.onStopMonitor();

  subscribeSuiEventService.unSubscribeEvent();

  server.close(() => {
    logger.info("Server closed.");
    process.exit();
  });

  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
