import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { authService } from "@/api/auth/authService";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { GetSaltRequest, GetSaltResponse } from "./authInterface";
import { logger } from "@/server";

class AuthController {
  public getSalt: RequestHandler = async (_req: Request, res: Response) => {
    const body = await _req.body;
    try {
      let dataRequest: GetSaltRequest = body as GetSaltRequest;
      if (dataRequest && dataRequest.subject && dataRequest.jwt) {
        logger.info(
          `Received request for FETCHING Salt for subject ${dataRequest.subject}`
        );

        const serviceResponse = await authService.getSaltBySubject(dataRequest);

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

export const authController = new AuthController();
