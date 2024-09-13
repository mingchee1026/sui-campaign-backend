import { StatusCodes } from "http-status-codes";

import { AuthRepository } from "./authRepository";
import { GetSaltRequest, GetSaltResponse } from "./authInterface";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { env } from "@/common/utils/envConfig";
import { logger } from "@/server";

export class AuthService {
  private authRepository: AuthRepository;

  constructor(repository: AuthRepository = new AuthRepository()) {
    this.authRepository = repository;
  }

  // Retrieves a salt by their subject
  async getSaltBySubject(
    dataRequest: GetSaltRequest
  ): Promise<ServiceResponse<GetSaltResponse | null>> {
    try {
      const saltFromDB = await this.authRepository.findSaltBySubjectAsync(
        dataRequest.subject
      );

      if (!saltFromDB.salt) {
        logger.warn(
          `Salt not found in database. Fetching from Mysten API. subject = ${dataRequest.subject}`
        );

        const saltFromMysten = await this.getSaltFromMystenAPI(
          dataRequest.jwt!
        );

        if (!saltFromMysten) {
          return ServiceResponse.failure(
            "Salt not found",
            null,
            StatusCodes.NOT_FOUND
          );
        }

        // storing new salt in DB
        await this.authRepository.saveSaltAsync(
          dataRequest.subject,
          saltFromMysten
        );

        saltFromDB.salt = saltFromMysten;
      }

      return ServiceResponse.success<GetSaltResponse>("Salt found", saltFromDB);
    } catch (ex) {
      const errorMessage = `Error finding salt with subject ${
        dataRequest.subject
      }:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding salt.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSaltFromMystenAPI(jwtEncoded: string): Promise<string | null> {
    const { SALT_API } = env;
    const url: string = SALT_API;
    const payload = { token: jwtEncoded };

    const response = await fetch(url!, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      referrerPolicy: "no-referrer",
      body: JSON.stringify(payload),
    });

    const responseJson = await response.json();

    return responseJson.salt;
  }
}

export const authService = new AuthService();
