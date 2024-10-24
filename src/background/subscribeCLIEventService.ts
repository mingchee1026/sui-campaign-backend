import EventEmitter from "eventemitter3";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { sponsorAndSignTransaction } from "@/common/utils/transactions/sponsorAndSignTransaction";
import { logger } from "@/server";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { StatusCodes } from "http-status-codes";
import { Resend } from "resend";
import {
  RegistrationConfirmEmailTemplate,
  ReferralConfirmEmailTemplate,
} from "@/common/utils/constant";

class SubscribeCLIEventService {
  private eventEmitter: EventEmitter;
  private resend: Resend;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.resend = new Resend(process.env.RESEND_API_KEY);

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
    logger.info("Event fired : sendRegisteredEmail");
    const { email } = data;

    await this.sendRegistrationConfirmation(email);

    logger.info("Event processed!!!");
  }

  async sendReferredEmail(data: { email: string; count: number }) {
    logger.info("Event fired : sendReferredEmail");
    const { email, count } = data;

    await this.sendReferralConfirmation(email, count);

    logger.info("Event processed!!!");
  }

  async executeActivityTx(data: {
    custodialAddress: string;
    custodialSecretKey: string;
    isNewUser: boolean;
    referrerAddress: string;
  }) {
    logger.info("Event fired : executeActivityTx");
    const { custodialAddress, custodialSecretKey, isNewUser, referrerAddress } =
      data;

    if (isNewUser) {
      await this.executeAddWhitelistTransaction(
        process.env.ADMIN_SECRET_KEY!,
        custodialAddress
      );
    }

    await this.executeActivityTransaction(custodialSecretKey, referrerAddress);

    logger.info("Event processed!!!");
  }

  sendRegistrationConfirmation = async (recipient: string) => {
    const { data, error } = await this.resend.emails.send({
      from: "6degrees <tech@6degrees.co>",
      to: [recipient],
      subject: "Congratulations on your registration!",
      html: RegistrationConfirmEmailTemplate,
      headers: {
        "List-Unsubscribe": "<https://example.com/unsubscribe>",
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
        "List-Unsubscribe": "<https://example.com/unsubscribe>",
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

    logger.info(`chain: ${process.env.SUI_NETWORK}`);

    const tx = new Transaction();

    tx.moveCall({
      target: `${process.env.PACKAGE_ADDRESS}::campaign::log_user_activity`,
      arguments: [
        tx.object(`${process.env.CAMPAIGN_SECURITY_ADDRESS}`), // campaign security object address
        tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
        tx.object("0x6"), // Clock object address
      ],
    });

    if (referrerAddress) {
      try {
        tx.moveCall({
          target: `${process.env.PACKAGE_ADDRESS}::campaign::create_referral`,
          arguments: [
            tx.object(`${process.env.CAMPAIGN_SECURITY_ADDRESS}`), // campaign security object address
            tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
            tx.pure.address(referrerAddress), // referrer address
            tx.object("0x6"), // Clock object address
          ],
        });
      } catch (error) {
        logger.error(error);
      }
    }

    const { digest } = await sponsorAndSignTransaction({
      tx,
      suiClient,
      senderSecretKey: custodialSecretKey,
    });

    logger.info(`digest: ${digest}`);
  };

  executeAddWhitelistTransaction = async (
    adminSecretKey: string,
    allowedAddress: string
  ) => {
    const suiClient = new SuiClient({
      url: process.env.SUI_NETWORK || "http://localhost",
    });

    logger.info(`chain: ${process.env.SUI_NETWORK}`);

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

    const { digest } = await sponsorAndSignTransaction({
      tx,
      suiClient,
      senderSecretKey: adminSecretKey,
    });

    logger.info(`digest: ${digest}`);
  };
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const subscribeCLIEventService = new SubscribeCLIEventService();
