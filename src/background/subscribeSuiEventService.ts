import {
  SuiClient,
  SuiHTTPTransport,
  Unsubscribe,
  getFullnodeUrl,
} from "@mysten/sui/client";
import { UserRepository } from "@/api/user/userRepository";

Object.assign(global, { WebSocket: require("ws") });

class SubscribeSuiEventService {
  private userRepository: UserRepository;
  private suiClient: SuiClient;
  private unsubscribe: Unsubscribe | undefined;

  constructor(repository: UserRepository = new UserRepository()) {
    this.userRepository = repository;
    this.suiClient = new SuiClient({
      // url: getFullnodeUrl("mainnet"),
      // transport: new SuiHTTPTransport({
      //   url: "https://fullnode.testnet.sui.io:443",
      //   websocket: {
      //     reconnectTimeout: 1000,
      //     url: "wss://rpc.testnet.sui.io:443",
      //   },
      // }),
      transport: new SuiHTTPTransport({
        url: getFullnodeUrl("mainnet"),
        WebSocketConstructor: WebSocket,
      }),
    });
  }

  async onSubscribeEvent() {
    const packageId = process.env.PACKAGE_ADDRESS;
    if (!packageId) {
      return;
    }

    console.log(
      await this.suiClient.getObject({
        id: packageId,
        options: { showPreviousTransaction: true },
      })
    );

    this.unsubscribe = await this.suiClient.subscribeEvent({
      filter: { Package: packageId },
      onMessage: (event) => {
        console.log("subscribeEvent", JSON.stringify(event, null, 2));
      },
    });
  }

  async unSubscribeEvent() {
    if (this.unsubscribe) {
      await this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }
}

export const subscribeSuiEventService = new SubscribeSuiEventService();
