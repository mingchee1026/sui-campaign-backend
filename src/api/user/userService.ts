import { UserRepository } from "@/api/user/userRepository";
import { CustodialwalletRepository } from "../custodialWallet/custodialwalletRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { sponsorAndSignTransaction } from "@/common/utils/transactions/sponsorAndSignTransaction";
import { logger } from "@/server";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { StatusCodes } from "http-status-codes";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
// import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  RegistrationConfirmEmailTemplate,
  ReferralConfirmEmailTemplate,
} from "@/common/utils/constant";
import { subscribeCLIEventService } from "@/background/subscribeCLIEventService";

import {
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  WebAuthnCredential,
} from "@simplewebauthn/server";

import type {
  IUser,
  UserRegisterRequest,
  UserRegisterResponse,
  Jwt,
  WebautnContext,
} from "./userInterface";

const WEBAUTHN_TIMEOUT = 1000 * 60 * 5; // 5 minutes

export class UserService {
  private userRepository: UserRepository;
  private custodialwalletRepository: CustodialwalletRepository;
  private resend: Resend;
  private maxCalls: number = 2;

  constructor() {
    this.userRepository = new UserRepository();
    this.custodialwalletRepository = new CustodialwalletRepository();
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  ///////////////
  async registerTest(requestObj: UserRegisterRequest): Promise<any> {
    try {
      console.log({ requestObj });

      const { campaign_id, wallet_address, referred_by } = requestObj;
      const subject = "test_google_subject";
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
          campaign_id,
          subject,
          email: "test_google_email",
          // salt: "",
          wallet_address: wallet_address,
          custodial_address: custodialWallet?.address!,
          attribution_code: generateUniqueReferrerCode(),
          referred_by: referred_by,
          user_name: jwt.name,
          avatar: jwt.picture,
          publicKey: "",
          callCount: 0,
          lastReset: 0,
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
        await this.userRepository.updateCustodialAddress(
          campaign_id,
          subject,
          custodial_address!
        );
      }

      // console.log({ sponsorWallet });

      // Check if the call limit has been reached
      const callable = await this.checkCallLimit(user);
      if (!callable) {
        return ServiceResponse.failure(
          "Contract call limit reached for today.",
          null,
          StatusCodes.TOO_MANY_REQUESTS
        );
      }

      return ServiceResponse.success<any>("Contract call.", null);
    } catch (ex) {
      const errorMessage = `Error during resistration zkLogin user: $${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  ////////////////

  // Register zkLogin user to the database
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
          attribution_code: generateUniqueReferrerCode(),
          referred_by: referred_by,
          user_name: jwt.name,
          avatar: jwt.picture,
          publicKey: "",
          callCount: 0,
          lastReset: 0,
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
        await this.userRepository.updateCustodialAddress(
          campaign_id,
          subject,
          custodial_address!
        );
      }

      // console.log({ sponsorWallet });

      // Check if the call limit has been reached
      const callable = await this.checkCallLimit(user);
      if (!callable) {
        return ServiceResponse.failure(
          "Contract call limit reached for today.",
          null,
          StatusCodes.TOO_MANY_REQUESTS
        );
      }

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
      const errorMessage = `Error during resistration zkLogin user: $${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Register webauthn user to the database
  async registerWebauthn(
    publicKey: string,
    challenge: string,
    signature: string,
    context: WebautnContext
  ): Promise<any> {
    try {
      console.log({ publicKey, challenge, signature, context });

      if (!publicKey || !challenge || !signature || !context) {
        return ServiceResponse.failure(
          "Invalid request or signature.",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const verification = await this.verifyWebauthnRegistration(
        signature,
        challenge,
        context
      );

      if (
        verification &&
        verification.verified &&
        verification.registrationInfo
      ) {
        // const { credential } = verification.registrationInfo;
        const subject = generateUniqueUserId(); // userId
        const campaign_id = process.env.CAMPAIGN_OBJECT_ADDRESS || "";

        let user = await this.userRepository.findByPublicKey(
          campaign_id,
          publicKey
        );

        if (user) {
          return ServiceResponse.failure(
            "User is already registered.",
            null,
            StatusCodes.BAD_REQUEST
          );
        }

        const custodialWallet =
          await this.custodialwalletRepository.findOneBySubject(
            campaign_id,
            subject
          );

        // console.log({ sponsorWallet, user });

        user = {
          campaign_id,
          subject,
          email: "",
          // salt: "",
          wallet_address: "",
          custodial_address: custodialWallet?.address!,
          attribution_code: generateUniqueReferrerCode(),
          referred_by: "",
          user_name: "",
          avatar: "",
          publicKey,
          callCount: 0,
          lastReset: 0,
        };

        await this.userRepository.create(user);

        const isNewUser = true;
        const referrerAddress = "";
        subscribeCLIEventService.getEventEmitter().emit("executeActivityTx", {
          custodialAddress: custodialWallet?.address!,
          custodialSecretKey: custodialWallet?.secretKey!,
          isNewUser,
          referrerAddress,
        });

        const token = jwt.sign(
          { userId: user.subject, publicKey, challenge },
          process.env.JWT_SECRET_KEY as string,
          {
            expiresIn: WEBAUTHN_TIMEOUT,
          }
        );

        const expiresMilliSec = new Date().getTime() + WEBAUTHN_TIMEOUT;
        const expiresAt = new Date(expiresMilliSec).toLocaleString();

        return ServiceResponse.success(
          "User successfully registered",
          {
            userId: subject,
            walletAddress: custodialWallet?.address!,
            token,
            expiresAt,
          },
          StatusCodes.CREATED
        );
      }

      return ServiceResponse.failure(
        "Registration failed.",
        null,
        StatusCodes.UNAUTHORIZED
      );
    } catch (ex) {
      const errorMessage = `Error during resistration webauthn user: $${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /* Check webauthn user from the database
  async checkWebauthn(
    publicKey: string,
    context: WebautnContext
  ): Promise<any> {
    try {
      console.log({ publicKey, context });

      const campaign_id = process.env.CAMPAIGN_OBJECT_ADDRESS || "";

      let user = await this.userRepository.findByPublicKey(
        campaign_id,
        publicKey
      );

      // console.log({ sponsorWallet, user });

      if (user) {
        return ServiceResponse.success(
          "User exists.",
          { exists: true, walletAddress: user.custodial_address },
          StatusCodes.OK
        );
      }

      return ServiceResponse.success(
        "User not exists.",
        { exists: false },
        StatusCodes.OK
      );
    } catch (ex) {
      const errorMessage = `Error finding user: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while checking user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
*/

  // Check webauthn user from the database
  async getWebauthnSession(
    publicKey: string,
    challenge: string,
    signature: string,
    context: WebautnContext
  ): Promise<any> {
    try {
      console.log({ publicKey, challenge, signature, context });

      if (!publicKey || !challenge || !signature || !context) {
        return ServiceResponse.failure(
          "Invalid request or signature.",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const campaign_id = process.env.CAMPAIGN_OBJECT_ADDRESS || "";

      let user = await this.userRepository.findByPublicKey(
        campaign_id,
        publicKey
      );

      // console.log({ sponsorWallet, user });

      if (user) {
        // const existingCredential: any = user.credential;
        // if (!existingCredential) {
        //   return ServiceResponse.success(
        //     "User not exists.",
        //     { exists: false },
        //     StatusCodes.NOT_FOUND
        //   );
        // }

        const verification = await this.verifyWebautnnAuthentication(
          publicKey,
          signature,
          challenge,
          context
        );

        if (verification && verification.verified) {
          // existingCredential.counter =
          //   verification.authenticationInfo.newCounter;

          // await this.userRepository.updateCredential(
          //   campaign_id,
          //   publicKey,
          //   existingCredential
          // );

          const token = jwt.sign(
            { userId: user.subject, publicKey, challenge },
            process.env.JWT_SECRET_KEY as string,
            {
              expiresIn: WEBAUTHN_TIMEOUT,
            }
          );

          const expiresMilliSec = new Date().getTime() + WEBAUTHN_TIMEOUT;
          const expiresAt = new Date(expiresMilliSec).toLocaleString();

          return ServiceResponse.success(
            "Login successfull.",
            {
              exists: true,
              walletAddress: user.custodial_address,
              token,
              expiresAt,
            },
            StatusCodes.OK
          );
        }

        return ServiceResponse.success(
          "Invalid request or signature.",
          { exists: false },
          StatusCodes.BAD_REQUEST
        );
      }

      return ServiceResponse.success(
        "User not exists.",
        { exists: false },
        StatusCodes.NOT_FOUND
      );
    } catch (ex) {
      const errorMessage = `Error creating user session: $${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating user session.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // user's login or referral
  async interactionsWebauthn(
    type: string,
    referrerPublicKey: string,
    context: WebautnContext,
    token: string | undefined
  ): Promise<any> {
    try {
      console.log({ type, referrerPublicKey, context, token });

      if (!type || !context) {
        return ServiceResponse.failure(
          "Invalid request or signature.",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      if (!token) {
        return ServiceResponse.failure(
          "Invalid or expired session token.",
          null,
          StatusCodes.UNAUTHORIZED
        );
      }

      const campaign_id = process.env.CAMPAIGN_OBJECT_ADDRESS || "";

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);

      const subject = decoded.userId;
      const publicKey = decoded.publicKey;
      const isNewUser = false;
      let referrerAddress = "";

      const owner = await this.userRepository.findByPublicKey(
        campaign_id,
        publicKey
      );

      if (!owner || owner.subject !== subject) {
        return ServiceResponse.failure(
          "Invalid interaction data.",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const custodialWallet =
        await this.custodialwalletRepository.findOneBySubject(
          campaign_id,
          subject
        );

      // Check if the call limit has been reached
      const callable = await this.checkCallLimit(owner);
      if (!callable) {
        return ServiceResponse.failure(
          "Contract call limit reached for today.",
          null,
          StatusCodes.TOO_MANY_REQUESTS
        );
      }

      if (type === "login") {
        subscribeCLIEventService.getEventEmitter().emit("executeActivityTx", {
          custodialAddress: custodialWallet?.address!,
          custodialSecretKey: custodialWallet?.secretKey!,
          isNewUser,
          referrerAddress,
        });

        return ServiceResponse.success(
          "Interaction recorded successfully.",
          { description: "Interaction recorded successfully." },
          StatusCodes.CREATED
        );
      } else {
        if (!referrerPublicKey) {
          return ServiceResponse.failure(
            "Invalid request or signature.",
            null,
            StatusCodes.BAD_REQUEST
          );
        }

        const referrer = await this.userRepository.findByPublicKey(
          campaign_id,
          referrerPublicKey
        );

        referrerAddress = referrer!.custodial_address;

        await this.userRepository.updateReferredBy(
          campaign_id,
          owner!.subject,
          referrer!.attribution_code
        );

        subscribeCLIEventService.getEventEmitter().emit("executeActivityTx", {
          custodialAddress: custodialWallet?.address!,
          custodialSecretKey: custodialWallet?.secretKey!,
          isNewUser,
          referrerAddress,
        });

        return ServiceResponse.success(
          "Interaction recorded successfully.",
          { description: "Interaction recorded successfully." },
          StatusCodes.CREATED
        );
      }
    } catch (ex) {
      const errorMessage = `Error while interacting with user: $${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while interacting with user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async verifyWebauthnRegistration(
    signature: string,
    challenge: string,
    context: WebautnContext
  ) {
    try {
      const registrationResponse: RegistrationResponseJSON =
        this.parseCompressedSignature(signature);

      // Verify the registration response
      const verification = await verifyRegistrationResponse({
        response: registrationResponse,
        expectedChallenge: challenge,
        expectedOrigin: context.rpOrigin,
        expectedRPID: context.rpId,
      });

      return verification;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async verifyWebautnnAuthentication(
    publicKey: string,
    signature: string,
    challenge: string,
    context: WebautnContext
    // existingCredential: WebAuthnCredential
  ) {
    try {
      const authenticationResponse: AuthenticationResponseJSON =
        this.parseCompressedSignature(signature);

      const verification = await verifyAuthenticationResponse({
        response: authenticationResponse,
        expectedOrigin: context.rpOrigin,
        expectedRPID: context.rpId,
        credential: {
          id: "FrakWallet",
          counter: 0,
          publicKey: new Uint8Array(Buffer.from(publicKey, "base64")),
        },
        expectedChallenge: challenge,
      });

      return verification;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  parseCompressedSignature<
    T extends RegistrationResponseJSON | AuthenticationResponseJSON
  >(signature: string): T {
    return JSON.parse(Buffer.from(signature, "base64").toString()); //.toString("utf-8"));
  }

  checkCallLimit = async (user: IUser) => {
    const now = this.getUTCNow();

    // Reset the call count if 24 hours have passed
    if (!user.lastReset || now - user.lastReset >= 24 * 60 * 60 * 1000) {
      user.callCount = 0;
      user.lastReset = now;

      // Update user info
      await this.userRepository.updateCallLimit(
        user.campaign_id,
        user.subject,
        user.callCount, // 0
        user.lastReset // now
      );
    }

    // Check if the call limit has been reached
    if (user.callCount < this.maxCalls) {
      user.callCount++;
      // Update user info
      await this.userRepository.updateCallCount(
        user.campaign_id,
        user.subject,
        user.callCount
      );

      // Call the function
      return true;
    } else {
      return false;
    }
  };

  getUTCNow = () => {
    const now = new Date();
    const time = now.getTime();
    let offset = now.getTimezoneOffset();
    offset = offset * 60000;

    return time - offset;
  };

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
      const errorMessage = `Error finding user referrals: $${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving user referrals.",
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
        "An error occurred while removing users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

/*
const verifyWebAuthnSignature = async (
  signature: string,
  publicKey: string,
  challenge: string
) => {
  try {
    // Convert base64 encoded data to byte arrays
    const signatureBytes = Buffer.from(signature, "base64");
    const publicKeyBytes = Buffer.from(publicKey, "base64");
    const challengeBytes = Buffer.from(challenge, "base64");

    const key = await crypto.subtle.importKey(
      "spki",
      publicKeyBytes,
      // { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      // { name: "ECDSA", hash: "SHA-256", namedCurve: "P-256" },
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"]
    );

    const verified = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      key,
      signatureBytes,
      challengeBytes
    );

    return verified; // true if signature is valid, false otherwise
  } catch (error) {
    console.error("Error verifying WebAuthn signature:", error);
    return false;
  }
};
*/

const generateUniqueUserId = () => {
  return uuidv4();
};

const generateUniqueReferrerCode = () => {
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
