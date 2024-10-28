import {
  SuiClient,
  SuiHTTPTransport,
  Unsubscribe,
  getFullnodeUrl,
} from "@mysten/sui/client";
import { UserRepository } from "@/api/user/userRepository";
import { logger } from "@/server";

Object.assign(global, { WebSocket: require("ws") });

class SubscribeSuiEventService {
  private userRepository: UserRepository;
  private suiClient: SuiClient;
  private unsubscribe: Unsubscribe | undefined;

  constructor(repository: UserRepository = new UserRepository()) {
    this.userRepository = repository;
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
    const packageId = process.env.PACKAGE_ADDRESS;
    if (!packageId) {
      return;
    }

    logger.info(
      await this.suiClient.getObject({
        id: packageId,
        options: { showPreviousTransaction: true },
      })
    );

    try {
      this.unsubscribe = await this.suiClient.subscribeTransaction({
        // .subscribeEvent({
        filter: {
          FromAddress: packageId,
          // All: [],
          // Package: packageId,
          // MoveEventType: `${packageId}::campaign::LoginEvent`,
          // MoveEventModule: {
          //   module: `${packageId}::campaign`,
          //   package: packageId,
          // },
        },
        onMessage: (event) => {
          console.log("subscribeEvent", JSON.stringify(event, null, 2));
        },
      });
    } catch (error) {
      logger.error(error);
    }
  }

  async unSubscribeEvent() {
    if (this.unsubscribe) {
      await this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }
}

export const subscribeSuiEventService = new SubscribeSuiEventService();
