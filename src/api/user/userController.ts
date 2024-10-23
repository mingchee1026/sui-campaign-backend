import type { Request, RequestHandler, Response } from "express";
import { jwtDecode } from "jwt-decode";
import { userService } from "@/api/user/userService";
import { custodialwalletService } from "../custodialWallet/custodialwalletService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class UserController {
  public register: RequestHandler = async (req: Request, res: Response) => {
    const body = await req.body;
    const { campaign_id, wallet_address, referred_by } = body;
    const authHeader = req.headers["authorization"];
    const jwt = authHeader && authHeader.split(" ")[1];

    const serviceResponse = await userService.register(
      {
        campaign_id,
        wallet_address,
        referred_by,
      },
      jwtDecode(jwt!)
    );

    return handleServiceResponse(serviceResponse, res);
  };

  public getUser: RequestHandler = async (req: Request, res: Response) => {
    const campaign_id = req.params.campaign_id as string;
    const subject = req.params.subject as string;
    const serviceResponse = await userService.findBySubject(
      campaign_id,
      subject
    );

    return handleServiceResponse(serviceResponse, res);
  };

  public getReferrals: RequestHandler = async (req: Request, res: Response) => {
    const attribution_code = req.params.attribution_code as string;
    const serviceResponse = await userService.findAllReferrals(
      attribution_code
    );

    return handleServiceResponse(serviceResponse, res);
  };

  public getSponsors: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await custodialwalletService.getCustodialWallets();

    return handleServiceResponse(serviceResponse, res);
  };

  public getUsers: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await userService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public removeAllUsers: RequestHandler = async (
    _req: Request,
    res: Response
  ) => {
    const serviceResponse = await userService.removeAll();
    return handleServiceResponse(serviceResponse, res);
  };
}

export const userController = new UserController();
