import type { Request, RequestHandler, Response } from "express";

import { userService } from "@/api/user/userService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

import { Ed25519Keypair, Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";

class UserController {
  public register: RequestHandler = async (req: Request, res: Response) => {
    const { campaign_id, wallet_address, wallet_keypair, salt, jwt, referred_by } = req.body;

    const serviceResponse = await userService.register({
      campaign_id,
      wallet_address,
      wallet_keypair,
      salt,
      jwt,
      referred_by,
    });

    return handleServiceResponse(serviceResponse, res);
  };

  public getUser: RequestHandler = async (req: Request, res: Response) => {
    const campaign_id = req.params.campaign_id as string;
    const subject = req.params.subject as string;
    const serviceResponse = await userService.findBySubject(campaign_id, subject);

    return handleServiceResponse(serviceResponse, res);
  };

  public getReferrals: RequestHandler = async (req: Request, res: Response) => {
    const attribution_code = req.params.attribution_code as string;
    const serviceResponse = await userService.findAllReferrals(attribution_code);

    return handleServiceResponse(serviceResponse, res);
  };

  /*
  public getUsers: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await userService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  */
}

export const userController = new UserController();
