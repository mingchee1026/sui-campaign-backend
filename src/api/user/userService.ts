import { UserRepository } from "@/api/user/userRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { sponsorAndSignTransaction } from "@/common/utils/transactions/sponsorAndSignTransaction";
import { logger } from "@/server";
import { SuiClient } from "@mysten/sui/client";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { StatusCodes } from "http-status-codes";
import { CustodialWallet } from "./custodialwalletModel";

import type { ISponsorWallet, RegisterUserRequest, UserResponse } from "./userInterface";

export class UserService {
  private userRepository: UserRepository;

  constructor(repository: UserRepository = new UserRepository()) {
    this.userRepository = repository;
  }

  // Retrieves all users from the database
  async register(requestObj: RegisterUserRequest): Promise<any> {
    try {
      const campaign_id = requestObj.campaign_id;
      const subject = requestObj.jwt.sub;
      const referred_by = requestObj.referred_by;
      let referrerAddress = "";

      const sponsorWallet = await this.getCustodialWallet(campaign_id, subject);

      let user = await this.userRepository.findBySubject(campaign_id, subject);
      if (!user) {
        user = {
          campaign_id: requestObj.campaign_id,
          subject: requestObj.jwt.sub,
          email: requestObj.jwt.email,
          salt: requestObj.salt,
          wallet_address: requestObj.wallet_address,
          custodial_address: sponsorWallet.address,
          attribution_code: generateUniqueCode(),
          referred_by: referred_by,
          user_name: requestObj.jwt.name,
          avatar: requestObj.jwt.picture,
          jwt: requestObj.jwt,
        };

        await this.userRepository.create(user);

        const referrerUser = await this.userRepository.findByAttributionCode(campaign_id, referred_by);

        referrerAddress = referrerUser?.wallet_address || "";
      } else {
        const jwt = requestObj.jwt;
        const referred_by = requestObj.referred_by;
        const custodial_address = sponsorWallet.address;
        await this.userRepository.updateJwt(
          campaign_id,
          subject,
          custodial_address,
          jwt,
          // referred_by
        );
        user.jwt = jwt;
      }

      const { sponsoredSignedTxn } = await executeActivityTransaction(
        requestObj.wallet_address,
        sponsorWallet.secretKey,
        referrerAddress,
      );

      return ServiceResponse.success<UserResponse>("User created", {
        user,
        sponsoredSignedTxn,
      });
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async findBySubject(campaign_id: string, subject: string): Promise<ServiceResponse<UserResponse | null>> {
    try {
      const user = await this.userRepository.findBySubject(campaign_id, subject);

      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<UserResponse>("User found", user);
    } catch (ex) {
      const errorMessage = `Error finding user with subject ${subject}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Retrieves all user's referrals from the database
  async findAllReferrals(attribution_code: string): Promise<ServiceResponse<UserResponse[] | null>> {
    try {
      let users = await this.userRepository.findAllByCode(attribution_code);
      if (!users || users.length === 0) {
        users = [];
      }
      return ServiceResponse.success<UserResponse[]>("Users found", users);
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<User[] | null>> {
    try {
      const users = await this.userRepository.findAllAsync();
      if (!users || users.length === 0) {
        return ServiceResponse.failure(
          "No Users found",
          null,
          StatusCodes.NOT_FOUND
        );
      }
      return ServiceResponse.success<User[]>("Users found", users);
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

  /* Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<User[] | null>> {
    try {
      const users = await this.userRepository.findAllAsync();
      if (!users || users.length === 0) {
        return ServiceResponse.failure(
          "No Users found",
          null,
          StatusCodes.NOT_FOUND
        );
      }
      return ServiceResponse.success<User[]>("Users found", users);
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

  // Retrieves a single user by their ID
  */

  // Create sponsors wallets and save to the database
  async createSponsorWallets(): Promise<ServiceResponse> {
    const sponsorWalletCount = Number.parseInt(process.env.SPONSOR_WALLET_COUNT || "50");
    for (let idx = 0; idx <= sponsorWalletCount; idx++) {
      try {
        const keypair = new Ed25519Keypair();
        const secretKey = keypair.getSecretKey();
        const publicKey = keypair.getPublicKey();
        const address = publicKey.toSuiAddress();

        const custodialWallet = new CustodialWallet({
          campaign_id: "",
          subject: "",
          address,
          secretKey,
          publicKey,
        });

        const result = await custodialWallet.save();
        await this.handleRequestSui(address);
      } catch (error) {
        console.log(`createSponsorWallets error: index=${idx} => ${error}`);
      }
    }

    return ServiceResponse.success("Sponsors wallets created.", null);
  }

  async getSponsorWallets(): Promise<ServiceResponse<ISponsorWallet[] | null>> {
    const custodialWallets = await CustodialWallet.find();

    return ServiceResponse.success("Sponsors wallets created.", custodialWallets);
  }

  async getCustodialWallet(campaign_id: string, subject: string): Promise<ISponsorWallet> {
    let custodialWallet = await CustodialWallet.findOne({
      campaign_id,
      subject,
    });

    if (!custodialWallet) {
      custodialWallet = await CustodialWallet.findOne({
        campaign_id: "",
        subject: "",
      });

      if (custodialWallet) {
        custodialWallet.campaign_id = campaign_id;
        custodialWallet.subject = subject;

        await custodialWallet.save();
      }
    }

    return custodialWallet;
  }

  async handleRequestSui(address: string) {
    await requestSuiFromFaucetV0({
      // connect to Devnet
      host: getFaucetHost("testnet"),
      recipient: address,
    });
  }
}

const generateUniqueCode = () => {
  return Math.random().toString(36).substring(2, 7); //.toUpperCase();
};

// Sponsor Transaction
const executeActivityTransaction = async (
  ephemeralAddress: string,
  sponsorSecretKey: string,
  referrerAddress: string,
) => {
  const suiClient = new SuiClient({
    url: process.env.SUI_NETWORK || "http://localhost",
  });

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

  const { sponsoredSignedTxn, sponsoredtx } = await sponsorAndSignTransaction({
    tx,
    suiClient,
    ephemeralAddress,
    sponsorSecretKey,
  });

  return { sponsoredSignedTxn };

  // if (!sponsoredSignedTxn || !sponsoredtx) {
  //   return { txDigest: "sponsoredSignedTxn and userSignedTxn is null" };
  // }

  // return suiClient
  //   .executeTransactionBlock({
  //     transactionBlock: sponsoredSignedTxn.bytes,
  //     signature: [sponsoredSignedTxn.signature], // [userSignedTxn.signature, sponsoredSignedTxn.signature],
  //     requestType: "WaitForLocalExecution",
  //     options: {
  //       showObjectChanges: true,
  //       showEffects: true,
  //     },
  //   })
  //   .then(async (res) => {
  //     const status = res?.effects?.status.status;
  //     if (status !== "success") {
  //       console.log("Activity Transaction failed: executeTransactionBlock");
  //     }
  //     return { txDigest: res.effects?.transactionDigest! };
  //   });

  /*
  const suiClient = new SuiClient({
    url: process.env.SUI_NETWORK || "http://localhost",
  });
  const sponsorKeypair = Ed25519Keypair.deriveKeypair(
    process.env.ADMIN_SECRET_KEY!
  );
  const sponserAddress = sponsorKeypair.getPublicKey().toSuiAddress();

  const tx = new Transaction();
  tx.moveCall({
    target: `${process.env.PACKAGE_ADDRESS}::single_player_blackjack::first_deal`,
    arguments: [
      tx.object(`${process.env.ADMIN_ADDRESS}`), // campaign object address
      tx.object("0x6"), // Clock object address
    ],
  });

  const kindBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });

  // construct a sponsored transaction from the kind bytes
  const sponsoredtx = Transaction.fromKind(kindBytes);

  // you can now set the sponsored transaction data that is required
  sponsoredtx.setSender(sender);
  sponsoredtx.setGasOwner(sponserAddress);
  // sponsoredtx.setGasPayment(sponsorCoins);

  const sponsoredTxnBuild = await sponsoredtx.build({ client: suiClient });
  const sponsoredSignedTxn = await sponsorKeypair.signTransaction(
    sponsoredTxnBuild
  );

  const ephemeralKeyPair = getKeypair(ephemeralKeyPairB64);
  const userSignedTxn = await ephemeralKeyPair.signTransaction(
    sponsoredTxnBuild
  );*/
};

export const userService = new UserService();
