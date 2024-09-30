import { SuiClient, SuiHTTPTransport, getFullnodeUrl } from "@mysten/sui/client";
import mongoose from "mongoose";

import { env } from "@/common/utils/envConfig";
import { app, logger } from "@/server";

Object.assign(global, { WebSocket: require("ws") });

let server: any;
mongoose.connect(env.MONGODB_URL).then(() => {
  logger.info("Connected to MongoDB");
  server = app.listen(env.PORT, () => {
    const { NODE_ENV, HOST, PORT } = env;
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);
  });
});

// const server = app.listen(env.PORT, () => {
//   const { NODE_ENV, HOST, PORT } = env;
//   logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);
// });

const onEventListner = async () => {
  // Package is on Testnet.
  const suiClient = new SuiClient({
    // url: getFullnodeUrl("mainnet"),
    // transport: new SuiHTTPTransport({
    //   url: "https://fullnode.testnet.sui.io:443",
    //   websocket: {
    //     reconnectTimeout: 1000,
    //     url: "wss://rpc.testnet.sui.io:443",
    //   },
    // }),
    transport: new SuiHTTPTransport({
      url: getFullnodeUrl("testnet"),
      WebSocketConstructor: WebSocket,
    }),
  });

  const packageId = process.env.PACKAGE_ADDRESS;
  if (!packageId) {
    return;
  }

  console.log(
    await suiClient.getObject({
      id: packageId,
      options: { showPreviousTransaction: true },
    }),
  );

  unsubscribe = await suiClient.subscribeEvent({
    filter: { Package: packageId },
    onMessage: (event) => {
      console.log("subscribeEvent", JSON.stringify(event, null, 2));
    },
  });
};

let unsubscribe: (() => any) | null | undefined = null;
onEventListner();

const onCloseSignal = async () => {
  logger.info("sigint received, shutting down");
  if (unsubscribe) {
    await unsubscribe();
    unsubscribe = undefined;
  }

  server.close(() => {
    logger.info("server closed");
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
