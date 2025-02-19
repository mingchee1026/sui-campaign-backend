import type { Request, RequestHandler, Response } from "express";
import { jwtDecode } from "jwt-decode";
import { userService } from "@/api/user/userService";
import { custodialwalletService } from "../custodialWallet/custodialwalletService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

import { ServiceResponse } from "@/common/models/serviceResponse";

class UserController {
  public registerTest: RequestHandler = async (req: Request, res: Response) => {
    const body = await req.body;

    const authHeader = req.headers["authorization"];
    const jwt = authHeader && authHeader.split(" ")[1];

    const serviceResponse = await userService.registerTest({
      campaign_id: "test_cap_address",
      wallet_address: "test_wallet_address",
      referred_by: "",
    });

    return handleServiceResponse(serviceResponse, res);
  };

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

  public registerWebauthn: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const body = await req.body;
    const { publicKey, signature, challenge, context } = body;

    const serviceResponse = await userService.registerWebauthn(
      publicKey,
      challenge,
      signature,
      context
    );

    return handleServiceResponse(serviceResponse, res);
  };

  /*
  public checkWebauthn: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const body = await req.body;
    const { publicKey, signature, context } = body;

    const serviceResponse = await userService.checkWebauthn(publicKey, context);

    return handleServiceResponse(serviceResponse, res);
  };
*/

  public getWebauthnSession: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const body = await req.body;
    const { publicKey, challenge, signature, context } = body;

    const serviceResponse = await userService.getWebauthnSession(
      publicKey,
      challenge,
      signature,
      context
    );

    return handleServiceResponse(serviceResponse, res);
  };

  public interactionsWebauthn: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const body = await req.body;
    const { type, referrerPublicKey, context } = body;

    const token = req.header("Authorization")?.replace("Bearer ", "");

    const serviceResponse = await userService.interactionsWebauthn(
      type,
      referrerPublicKey,
      context,
      token
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

  private verifyWebAuthnSignature = async (
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
}

export const userController = new UserController();
