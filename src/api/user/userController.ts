import type { Request, RequestHandler, Response } from "express";
import { jwtDecode } from "jwt-decode";
import { userService } from "@/api/user/userService";
import { custodialwalletService } from "../custodialWallet/custodialwalletService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

import { ServiceResponse } from "@/common/models/serviceResponse";

import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import * as fs from "fs";
import * as path from "path";

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
    const address = req.params.address as string;
    const serviceResponse = await userService.findByCustodialAddress(address);

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
    req: Request,
    res: Response
  ) => {
    const serviceResponse = await userService.removeAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public updateCampId: RequestHandler = async (req: Request, res: Response) => {
    const campaign_id = req.params.campaign_id as string;
    const serviceResponse = await userService.updateCampId(campaign_id);
    return handleServiceResponse(serviceResponse, res);
  };

  /////////////////////////

  // Function to write the array to a file
  public writeArrayToFile(filePath: string, array: string[]): void {
    fs.writeFileSync(filePath, JSON.stringify(array), "utf8");
    // console.log(`Array written to ${filePath}`);
  }

  // Function to read the array from a file
  public readArrayFromFile(filePath: string): string[] {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  }

  public removeRef: RequestHandler = async (req: Request, res: Response) => {
    const suiClient = new SuiClient({
      url: process.env.SUI_NETWORK || "http://localhost",
    });
    // Define the file path
    const filePath = path.join(__dirname, "ref.json");

    let cursor: string | null = null;
    let allFields: any[] = [];
    do {
      const ret = await suiClient.getDynamicFields({
        parentId:
          "0xcb78c5a75f1bc3553fcea082649b2094ba6c265857101c6b2c6e50c2833107ff",
        cursor,
      });
      allFields.push(...ret.data);
      cursor = ret.hasNextPage ? ret.nextCursor : null;
    } while (cursor);

    const keys = allFields.map((field) => field.name.value);
    console.log(keys);

    // Write the array to the file
    this.writeArrayToFile(filePath, keys);

    // Read the array from the file
    const addresses = this.readArrayFromFile(filePath);

    const { schema, secretKey } = decodeSuiPrivateKey(
      process.env.ADMIN_SECRET_KEY!
    );
    const adminKeypair = Ed25519Keypair.fromSecretKey(secretKey);

    for (const key of addresses) {
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${process.env.PACKAGE_ADDRESS}::campaign::remove_referrals_update_last`,
          arguments: [
            // tx.object(`${process.env.CAMPAIGN_ADMIN_CAP_ADDRESS}`), // campaign admincap object address
            tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
            tx.pure.address(key), // allowed address
          ],
        });

        await suiClient.signAndExecuteTransaction({
          signer: adminKeypair,
          transaction: tx,
        });

        console.log(`Removed address: ${key} !!!`);
      } catch (error) {
        console.log(`Error: ${error} !!!`);
      }
    }

    return res.status(200).send("OK");
  };

  public removeLog: RequestHandler = async (req: Request, res: Response) => {
    // Define the file path
    const keyPath = path.join(__dirname, "log.json");
    const excludePath = path.join(__dirname, "exclude.json");

    const suiClient = new SuiClient({
      url: process.env.SUI_NETWORK || "http://localhost",
    });

    let cursor: string | null = null;
    let allFields: any[] = [];
    // do {
    const ret = await suiClient.getDynamicFields({
      parentId:
        "0x063e7df715e9fd839ccae75b50aa3e897726149041848fa4b1493e92bc5cdf59",
      cursor,
    });
    allFields.push(...ret.data);
    cursor = ret.hasNextPage ? ret.nextCursor : null;
    // } while (cursor);

    const keys = allFields.map((field) => field.name.value);
    console.log(keys);

    // Write the array to the file
    this.writeArrayToFile(keyPath, keys);

    // Read the array from the file
    const key_addresses = this.readArrayFromFile(keyPath);
    const exclude_addresses = this.readArrayFromFile(excludePath);

    const { schema, secretKey } = decodeSuiPrivateKey(
      process.env.ADMIN_SECRET_KEY!
    );
    const adminKeypair = Ed25519Keypair.fromSecretKey(secretKey);

    for (const key of key_addresses) {
      if (exclude_addresses.includes(key)) {
        continue;
      }

      console.log(`New Address: ${key}`);
      const tx = new Transaction();
      tx.moveCall({
        target: `${process.env.PACKAGE_ADDRESS}::campaign::remove_activities_update_last`,
        arguments: [
          // tx.object(`${process.env.CAMPAIGN_ADMIN_CAP_ADDRESS}`), // campaign admincap object address
          tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
          tx.pure.address(key), // allowed address
        ],
      });

      await suiClient.signAndExecuteTransaction({
        signer: adminKeypair,
        transaction: tx,
      });

      console.log(`Removed address: ${key} !!!`);

      exclude_addresses.push(key);

      // Write the array to the exclude file
      this.writeArrayToFile(excludePath, exclude_addresses);
    }

    return res.status(200).send("OK");
  };

  public removeWL: RequestHandler = async (req: Request, res: Response) => {
    const suiClient = new SuiClient({
      url: process.env.SUI_NETWORK || "http://localhost",
    });
    // Define the file path
    const filePath = path.join(__dirname, "whitelist.json");

    let cursor: string | null = null;
    let allFields: any[] = [];
    do {
      const ret = await suiClient.getDynamicFields({
        parentId:
          "0x92ec4bfd04e549a8021ded25395272a9fce2cab1b9c5d8e74c221382a44d0298",
        cursor,
      });
      allFields.push(...ret.data);
      if (allFields.length >= 10000) {
        break;
      }
      cursor = ret.hasNextPage ? ret.nextCursor : null;
    } while (cursor);

    const keys = allFields.map((field) => field.name.value);
    console.log(`Total: ${keys.length}`);

    // Write the array to the file
    this.writeArrayToFile(filePath, keys);

    // Read the array from the file
    // const addresses = this.readArrayFromFile(filePath);

    const { schema, secretKey } = decodeSuiPrivateKey(
      process.env.ADMIN_SECRET_KEY!
    );
    const adminKeypair = Ed25519Keypair.fromSecretKey(secretKey);

    let idx = 1;
    for (const key of keys) {
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${process.env.PACKAGE_ADDRESS}::campaign::remove_whitelist`,
          arguments: [
            // tx.object(`${process.env.CAMPAIGN_ADMIN_CAP_ADDRESS}`), // campaign admincap object address
            tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
            tx.pure.address(key), // allowed address
          ],
        });

        await suiClient.signAndExecuteTransaction({
          signer: adminKeypair,
          transaction: tx,
        });

        console.log(`Removed address: ${key} ${idx} !!!`);
        idx++;
      } catch (error) {
        console.log(`Error: ${error} !!!`);
      }
    }

    return res.status(200).send("OK");
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
