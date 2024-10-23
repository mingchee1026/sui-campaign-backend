import { UserRepository } from "@/api/user/userRepository";
import { CustodialwalletRepository } from "../custodialWallet/custodialwalletRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
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
import { subscribeCLIEventService } from "@/background/subscribeCLIEventService";

import type {
  IUser,
  UserRegisterRequest,
  UserRegisterResponse,
  Jwt,
} from "./userInterface";

export class UserService {
  private userRepository: UserRepository;
  private custodialwalletRepository: CustodialwalletRepository;
  private resend: Resend;

  constructor() {
    this.userRepository = new UserRepository();
    this.custodialwalletRepository = new CustodialwalletRepository();
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  // Retrieves all users from the database
  async register(requestObj: UserRegisterRequest, jwt: Jwt): Promise<any> {
    try {
      console.log({ requestObj });

      const { campaign_id, wallet_address, referred_by } = requestObj;
      const subject = jwt.sub;
      let isNewUser = false;
      let referrerAddress = "";

      const custodialWallet =
        await this.custodialwalletRepository.findOneBySubject(
          campaign_id,
          subject
        );

      let user = await this.userRepository.findBySubject(campaign_id, subject);

      // console.log({ sponsorWallet, user });

      if (!user) {
        isNewUser = true;

        user = {
          campaign_id: requestObj.campaign_id,
          subject: jwt.sub,
          email: jwt.email,
          // salt: "",
          wallet_address: wallet_address,
          custodial_address: custodialWallet?.address!,
          attribution_code: generateUniqueCode(),
          referred_by: referred_by,
          user_name: jwt.name,
          avatar: jwt.picture,
        };

        // console.log({ user });

        // Save new user
        await this.userRepository.create(user);

        // Send registration confirmation email
        subscribeCLIEventService
          .getEventEmitter()
          .emit("sendRegisteredEmail", { email: jwt.email });

        if (referred_by && referred_by !== "") {
          const referrerUser = await this.userRepository.findByAttributionCode(
            campaign_id,
            referred_by
          );

          if (referrerUser) {
            const count = await this.userRepository.countByCode(referred_by);

            // Send referral confirmation email
            subscribeCLIEventService
              .getEventEmitter()
              .emit("sendReferredEmail", { email: referrerUser.email, count });

            referrerAddress = referrerUser.custodial_address;
          }
        }
      } else {
        const custodial_address = custodialWallet?.address;
        await this.userRepository.update(
          campaign_id,
          subject,
          custodial_address!
        );
      }

      // console.log({ sponsorWallet });

      subscribeCLIEventService.getEventEmitter().emit("executeActivityTx", {
        custodialAddress: custodialWallet?.address!,
        custodialSecretKey: custodialWallet?.secretKey!,
        isNewUser,
        referrerAddress,
      });

      // await executeActivityTransaction(
      //   custodialWallet?.secretKey!,
      //   referrerAddress
      // );

      return ServiceResponse.success<UserRegisterResponse>("User created", {
        user,
        digest: "digest",
      });
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findBySubject(
    campaign_id: string,
    subject: string
  ): Promise<ServiceResponse<IUser | null>> {
    try {
      const user = await this.userRepository.findBySubject(
        campaign_id,
        subject
      );

      if (!user) {
        return ServiceResponse.failure(
          "User not found",
          null,
          StatusCodes.NOT_FOUND
        );
      }
      return ServiceResponse.success<IUser>("User found", user);
    } catch (ex) {
      const errorMessage = `Error finding user with subject ${subject}:, ${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Retrieves all user's referrals from the database
  async findAllReferrals(
    attribution_code: string
  ): Promise<ServiceResponse<IUser[] | null>> {
    try {
      let users = await this.userRepository.findAllByCode(attribution_code);
      if (!users || users.length === 0) {
        users = [];
      }
      return ServiceResponse.success<IUser[]>("Users found", users);
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<IUser[] | null>> {
    try {
      const users = await this.userRepository.findAll();
      if (!users || users.length === 0) {
        return ServiceResponse.failure(
          "No Users found",
          null,
          StatusCodes.NOT_FOUND
        );
      }
      return ServiceResponse.success<IUser[]>("Users found", users);
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Removes all users from the database
  async removeAll(): Promise<ServiceResponse<null>> {
    try {
      await this.userRepository.removeAll();
      return ServiceResponse.success<null>("Users found", null);
    } catch (ex) {
      const errorMessage = `Error removing all users: $${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

const generateUniqueCode = () => {
  return Math.random().toString(36).substring(2, 7); //.toUpperCase();
};

// Sponsor Transaction
const executeActivityTransaction = async (
  custodialSecretKey: string,
  referrerAddress: string
) => {
  const suiClient = new SuiClient({
    url: process.env.SUI_NETWORK || "http://localhost",
  });

  console.log({ chain: process.env.SUI_NETWORK });

  const tx = new Transaction();
  tx.moveCall({
    target: `${process.env.PACKAGE_ADDRESS}::campaign::log_user_activity`,
    arguments: [
      tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
      tx.object("0x6"), // Clock object address
    ],
  });

  if (referrerAddress) {
    try {
      tx.moveCall({
        target: `${process.env.PACKAGE_ADDRESS}::campaign::create_referral`,
        arguments: [
          tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
          tx.pure.address(referrerAddress), // referrer address
          tx.object("0x6"), // Clock object address
        ],
      });
    } catch (error) {
      console.log({ error });
    }
  }

  const { digest } = await sponsorAndSignTransaction({
    tx,
    suiClient,
    senderSecretKey: custodialSecretKey,
  });

  return { digest };
};

export const userService = new UserService();
