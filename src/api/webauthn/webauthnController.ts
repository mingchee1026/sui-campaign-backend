import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { database } from "./db";
import { CustodialwalletRepository } from "../custodialWallet/custodialwalletRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { logger } from "@/server";

class WebAuthnController {
  private custodialwalletRepository: CustodialwalletRepository;

  constructor() {
    this.custodialwalletRepository = new CustodialwalletRepository();
  }

  public register: RequestHandler = async (_req: Request, res: Response) => {
    const body = await _req.body;
    try {
      const { username, name } = body;

      if (username && name) {
        logger.info(`Received request for user ${username}`);
        database["username"] = "";
        if (database[username] && database[username].registered) {
          const serviceResponse = ServiceResponse.failure(
            `Username ${username} already exists.`,
            null,
            StatusCodes.NOT_FOUND
          );

          return handleServiceResponse(serviceResponse, res);
        }

        let getAssertion = utils.generateServerGetAssertion(
          database[username].authenticators
        );
        getAssertion.status = "ok";

        request.session.challenge = getAssertion.challenge;
        request.session.username = username;

        response.json(getAssertion);
      }

      const serviceResponse = ServiceResponse.failure(
        "Request missing name or username field!",
        null,
        StatusCodes.NOT_FOUND
      );

      return handleServiceResponse(serviceResponse, res);
    } catch (e) {
      logger.error(`Inner error= ${e}`);

      const serviceResponse = ServiceResponse.failure(
        "Inner error",
        null,
        StatusCodes.NOT_FOUND
      );

      return handleServiceResponse(serviceResponse, res);
    }
  };

  public login: RequestHandler = async (_req: Request, res: Response) => {
    const body = await _req.body;
    try {
      const { subject, salt } = body;
      const authHeader = _req.headers["authorization"];
      const jwt = authHeader && authHeader.split(" ")[1];
      if (subject && jwt) {
        logger.info(
          `Received request for FETCHING Salt for subject ${subject}`
        );

        const serviceResponse = await authService.getSaltBySubject({
          jwt,
          subject,
          salt,
        });

        return handleServiceResponse(serviceResponse, res);
      }

      const serviceResponse = ServiceResponse.failure(
        "Wrong Request Body Format!",
        null,
        StatusCodes.NOT_FOUND
      );

      return handleServiceResponse(serviceResponse, res);
    } catch (e) {
      logger.error(`Inner error= ${e}`);

      const serviceResponse = ServiceResponse.failure(
        "Inner error",
        null,
        StatusCodes.NOT_FOUND
      );

      return handleServiceResponse(serviceResponse, res);
    }
  };

  public response: RequestHandler = async (_req: Request, res: Response) => {
    const body = await _req.body;
    try {
      const { subject, salt } = body;
      const authHeader = _req.headers["authorization"];
      const jwt = authHeader && authHeader.split(" ")[1];
      if (subject && jwt) {
        logger.info(
          `Received request for FETCHING Salt for subject ${subject}`
        );

        const serviceResponse = await authService.getSaltBySubject({
          jwt,
          subject,
          salt,
        });

        return handleServiceResponse(serviceResponse, res);
      }

      const serviceResponse = ServiceResponse.failure(
        "Wrong Request Body Format!",
        null,
        StatusCodes.NOT_FOUND
      );

      return handleServiceResponse(serviceResponse, res);
    } catch (e) {
      logger.error(`Inner error= ${e}`);

      const serviceResponse = ServiceResponse.failure(
        "Inner error",
        null,
        StatusCodes.NOT_FOUND
      );

      return handleServiceResponse(serviceResponse, res);
    }
  };
}

export const webauthnController = new WebAuthnController();
