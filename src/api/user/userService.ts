import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { StatusCodes } from "http-status-codes";

import { CustodialAddress } from "@/api/user/custodialAddressModel";
import type { User } from "@/api/user/userModel";
import { UserRepository } from "@/api/user/userRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { RegisterUserRequest, UserResponse } from "./userInterface";

export class UserService {
  private userRepository: UserRepository;

  constructor(repository: UserRepository = new UserRepository()) {
    this.userRepository = repository;
  }

  // Retrieves all users from the database
  async register(requestObj: RegisterUserRequest): Promise<ServiceResponse<UserResponse | null>> {
    try {
      const campaign_id = requestObj.campaign_id;
      const subject = requestObj.jwt.sub;
      let user = await this.userRepository.findBySubject(campaign_id, subject);
      if (!user) {
        const custodial_address = await generateCustodialAddress(campaign_id, subject);
        user = {
          campaign_id: requestObj.campaign_id,
          subject: requestObj.jwt.sub,
          email: requestObj.jwt.email,
          salt: requestObj.salt,
          wallet_address: requestObj.wallet_address,
          custodial_address,
          attribution_code: generateUniqueCode(),
          referred_by: requestObj.attribution_code!,
          user_name: requestObj.jwt.name,
          avatar: requestObj.jwt.picture,
          jwt: requestObj.jwt,
        };

        await this.userRepository.create(user);
      } else {
        const jwt = requestObj.jwt;
        const attribution_code = requestObj.attribution_code;
        await this.userRepository.updateJwt(campaign_id, subject, jwt, attribution_code);
        user.jwt = jwt;
      }

      return ServiceResponse.success<UserResponse>("User created", user);
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
        // return ServiceResponse.failure(
        //   "No Users found",
        //   null,
        //   StatusCodes.NOT_FOUND
        // );
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
}

const generateUniqueCode = () => {
  return Math.random().toString(36).substring(2, 7); //.toUpperCase();
};

const generateCustodialAddress = async (campaign_id: string, subject: string): Promise<string> => {
  const keypair = new Ed25519Keypair();
  const secretKey = keypair.getSecretKey();
  const publicKey = keypair.getPublicKey();
  const address = publicKey.toSuiAddress();

  const custodialAddress = new CustodialAddress({
    campaign_id,
    subject,
    address,
    secretKey,
    publicKey,
  });

  const result = await custodialAddress.save();

  return address;
};

export const userService = new UserService();
