import type { Request, RequestHandler, Response } from "express";
import { SuiClient, SuiObjectChangeCreated } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { jwtDecode } from "jwt-decode";
import { userService } from "@/api/user/userService";
import { custodialwalletService } from "../custodialWallet/custodialwalletService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { CreateCampaignObjectProps } from "./campaignInterface";

class CampaignController {
  public registerPackage: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const body = await req.body;
    const { title, about } = body;
    const authHeader = req.headers["authorization"];
    const jwt = authHeader && authHeader.split(" ")[1];

    // const serviceResponse = await userService.register(
    //   {
    //     campaign_id,
    //     wallet_address,
    //     referred_by,
    //   },
    //   jwtDecode(jwt!)
    // );

    // return handleServiceResponse(serviceResponse, res);
  };

  public create: RequestHandler = async (req: Request, res: Response) => {
    const body = await req.body;
    const { title, about } = body;
    const authHeader = req.headers["authorization"];
    const jwt = authHeader && authHeader.split(" ")[1];

    // const serviceResponse = await userService.register(
    //   {
    //     campaign_id,
    //     wallet_address,
    //     referred_by,
    //   },
    //   jwtDecode(jwt!)
    // );

    // return handleServiceResponse(serviceResponse, res);
  };

  createCampaignObject = async ({
    adminSecretKey,
    title,
    about,
  }: CreateCampaignObjectProps) => {
    const suiClient = new SuiClient({
      url: process.env.SUI_NETWORK || "http://localhost",
    });

    const { schema, secretKey } = decodeSuiPrivateKey(adminSecretKey);
    const adminKeypair = Ed25519Keypair.fromSecretKey(secretKey);

    const tx = new Transaction();

    tx.moveCall({
      target: `${process.env.PACKAGE_ADDRESS}::camapign::create_campaign`,
      arguments: [
        tx.object(`${process.env.CAMPAIGN_ADMIN_CAP_ADDRESS}`), // campaign admincap object address
        tx.pure.string(title), // campaign title
        tx.pure.string(about), // campaign description
        tx.object("0x6"), // Clock object address
      ],
    });

    try {
      const resp = await suiClient.signAndExecuteTransaction({
        signer: adminKeypair,
        transaction: tx,
        requestType: "WaitForLocalExecution",
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      });

      const status = resp?.effects?.status.status;
      if (status !== "success") {
        throw new Error("Campaign not created");
      }
      const createdObjects = resp.objectChanges?.filter(
        ({ type }) => type === "created"
      ) as SuiObjectChangeCreated[];
      const createdCampaign = createdObjects.find(({ objectType }) =>
        objectType.endsWith("campaign::Campaign")
      );
      if (!createdCampaign) {
        throw new Error("Game not created");
      }
      const { objectId } = createdCampaign;
      console.log("Created game id:", objectId);
      return objectId;
    } catch (error) {}
  };
}

export const campaignController = new CampaignController();
