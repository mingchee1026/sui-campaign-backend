import EventEmitter from "eventemitter3";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { sponsorAndSignTransaction } from "@/common/utils/transactions/sponsorAndSignTransaction";
import { logger } from "@/server";
import { CustodialwalletRepository } from "@/api/custodialWallet/custodialwalletRepository";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { StatusCodes } from "http-status-codes";
import { Resend } from "resend";
import {
  RegistrationConfirmEmailTemplate,
  ReferralConfirmEmailTemplate,
} from "@/common/utils/constant";
import { Mutex } from "async-mutex";

// const sponserTxMutex = new Mutex();

class SubscribeCLIEventService {
  private eventEmitter: EventEmitter;
  private resend: Resend;
  private sponserTxMutex: Mutex;
  private repository: CustodialwalletRepository;

  constructor(
    repository: CustodialwalletRepository = new CustodialwalletRepository()
  ) {
    this.eventEmitter = new EventEmitter();
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.sponserTxMutex = new Mutex();
    this.repository = repository;

    this.initialize();
  }

  getEventEmitter() {
    return this.eventEmitter;
  }

  initialize() {
    this.eventEmitter.on(
      "sendRegisteredEmail",
      this.sendRegisteredEmail.bind(this)
    );

    this.eventEmitter.on(
      "sendReferredEmail",
      this.sendReferredEmail.bind(this)
    );

    this.eventEmitter.on(
      "executeActivityTx",
      this.executeActivityTx.bind(this)
    );
  }

  async sendRegisteredEmail(data: { email: string }) {
    logger.info("----------------------------------------------------------");
    logger.info("Event fired : sendRegisteredEmail");

    const { email } = data;

    await this.sendRegistrationConfirmation(email);

    logger.info("Event processed!!!");
  }

  async sendReferredEmail(data: { email: string; count: number }) {
    logger.info("----------------------------------------------------------");
    logger.info("Event fired : sendReferredEmail");

    const { email, count } = data;

    await this.sendReferralConfirmation(email, count);

    logger.info("Event processed!!!");
  }

  async executeActivityTx(data: {
    type: string;
    custodialAddress: string;
    custodialSecretKey: string;
    isNewUser: boolean;
    referrerAddress: string;
  }) {
    // const release = await sponserTxMutex.acquire();

    // try {

    const {
      type,
      custodialAddress,
      custodialSecretKey,
      isNewUser,
      referrerAddress,
    } = data;

    await this.sponserTxMutex.runExclusive(async () => {
      const startTime = performance.now();
      logger.info("----------------------------------------------------------");
      logger.info(`Event fired : ${type}`);

      if (isNewUser) {
        logger.info(`Resister address : ${custodialAddress}`);
        await this.executeAddWhitelistTransaction(
          process.env.ADMIN_SECRET_KEY!,
          custodialAddress
        );
      } else {
        logger.info(`Interaction address : ${custodialAddress}`);

        const whiteList = await this.repository.findWhiteListByAddress(
          process.env.CAMPAIGN_OBJECT_ADDRESS || "",
          custodialAddress
        );

        if (!whiteList) {
          logger.info(`Resister address : ${custodialAddress}`);
          await this.executeAddWhitelistTransaction(
            process.env.ADMIN_SECRET_KEY!,
            custodialAddress
          );
        }

        if (referrerAddress) {
          const whiteList1 = await this.repository.findWhiteListByAddress(
            process.env.CAMPAIGN_OBJECT_ADDRESS || "",
            referrerAddress
          );

          if (!whiteList1) {
            logger.info(`Resister address : ${referrerAddress}`);
            await this.executeAddWhitelistTransaction(
              process.env.ADMIN_SECRET_KEY!,
              referrerAddress
            );
          }
        }

        await this.executeActivityTransaction(
          custodialSecretKey,
          referrerAddress
        );
      }

      const endTime = performance.now();

      logger.info(
        `Event processed !!! Total: ${endTime - startTime} milliseconds`
      );
    });

    // } finally {
    //   release();
    // }
  }

  sendRegistrationConfirmation = async (recipient: string) => {
    const { data, error } = await this.resend.emails.send({
      from: "6degrees <tech@6degrees.co>",
      to: [recipient],
      subject: "Congratulations on your registration!",
      html: RegistrationConfirmEmailTemplate,
      headers: {
        "List-Unsubscribe": "<https://unsubscribe.6degrees.co>",
      },
    });

    if (error) {
      logger.error(error);
    }
  };

  sendReferralConfirmation = async (recipient: string, referred: number) => {
    const { data, error } = await this.resend.emails.send({
      from: "6degrees <tech@6degrees.co>",
      to: [recipient],
      subject: "Great news! One of your friends has accepted your referral.",
      html: ReferralConfirmEmailTemplate(referred),
      headers: {
        "List-Unsubscribe": "<https://unsubscribe.6degrees.co>",
      },
    });

    if (error) {
      logger.error(error);
    }
  };

  // Sponsor Transaction
  executeActivityTransaction = async (
    custodialSecretKey: string,
    referrerAddress: string
  ) => {
    const suiClient = new SuiClient({
      url: process.env.SUI_NETWORK || "http://localhost",
    });

    // logger.info(`chain: ${process.env.SUI_NETWORK}`);

    const tx = new Transaction();

    tx.moveCall({
      target: `${process.env.PACKAGE_ADDRESS}::campaign::log_user_activity`,
      arguments: [
        // tx.object(`${process.env.CAMPAIGN_SECURITY_ADDRESS}`), // campaign security object address
        tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
        tx.object("0x6"), // Clock object address
      ],
    });

    if (referrerAddress) {
      logger.info(`Referrer address : ${referrerAddress}`);

      try {
        tx.moveCall({
          target: `${process.env.PACKAGE_ADDRESS}::campaign::create_referral`,
          arguments: [
            // tx.object(`${process.env.CAMPAIGN_SECURITY_ADDRESS}`), // campaign security object address
            tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
            tx.pure.address(referrerAddress), // referrer address
            tx.object("0x6"), // Clock object address
          ],
        });
      } catch (error) {
        logger.error(error);
      }
    }

    let digest = null;
    // const release = await sponserTxMutex.acquire();

    try {
      const results = await sponsorAndSignTransaction({
        tx,
        suiClient,
        senderSecretKey: custodialSecretKey,
        isRegister: false,
      });

      digest = results.digest;
    } finally {
      // release();
    }

    logger.info(`digest: ${digest}`);
  };

  executeAddWhitelistTransaction = async (
    adminSecretKey: string,
    allowedAddress: string
  ) => {
    const suiClient = new SuiClient({
      url: process.env.SUI_NETWORK || "http://localhost",
    });

    // logger.info(`chain: ${process.env.SUI_NETWORK}`);

    const tx = new Transaction();

    tx.moveCall({
      target: `${process.env.PACKAGE_ADDRESS}::campaign::add_whitelist`,
      arguments: [
        tx.object(`${process.env.CAMPAIGN_ADMIN_CAP_ADDRESS}`), // campaign admincap object address
        tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
        tx.pure.address(allowedAddress), // allowed address
        tx.pure.bool(true), // permission okay
      ],
    });

    let digest = null;
    // const release = await sponserTxMutex.acquire();

    try {
      const results = await sponsorAndSignTransaction({
        tx,
        suiClient,
        senderSecretKey: adminSecretKey,
        isRegister: true,
      });

      digest = results.digest;

      if (digest) {
        await this.repository.createWhitelist({
          campaign_id: process.env.CAMPAIGN_OBJECT_ADDRESS || "",
          address: allowedAddress,
          permission: true,
        });
      }
    } finally {
      // release();
    }

    logger.info(`digest: ${digest}`);
  };
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const subscribeCLIEventService = new SubscribeCLIEventService();
