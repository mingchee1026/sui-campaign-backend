import type { Request, RequestHandler, Response } from "express";
import { sponsorAndSignTransaction } from "@/common/utils/transactions/sponsorAndSignTransaction";
import { logger } from "@/server";
import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { StatusCodes } from "http-status-codes";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { CustodialWallet, ActivityTestResponse } from "./analyticsInterface";

class AnalyticsController {
  public testActivityLog: RequestHandler = async (
    req: Request,
    res: Response
  ) => {
    const count = req.params.count;
    console.log({ count });
    const custodialWallets = await this.createCustodialWallets(parseInt(count));
    const ret = await this.executeActivityTransactionForTest(custodialWallets);

    const serviceResponse = ServiceResponse.success<ActivityTestResponse[]>(
      `The test has been completed. Total count: ${count}`,
      ret
    );

    return handleServiceResponse(serviceResponse, res);
  };

  // Create sponsors wallets and save to the database
  async createCustodialWallets(count: number): Promise<CustodialWallet[]> {
    let custodialWallets: CustodialWallet[] = [];
    for (let idx = 0; idx < count; idx++) {
      try {
        const keypair = new Ed25519Keypair();
        const secretKey = keypair.getSecretKey();
        const publicKey = keypair.getPublicKey();
        const address = publicKey.toSuiAddress();

        const custodialWallet: CustodialWallet = {
          address,
          secretKey,
        };

        custodialWallets.push(custodialWallet);
      } catch (error) {
        console.log(`createSponsorWallets error: index=${idx} => ${error}`);
      }
    }

    return custodialWallets;
  }

  // Sponsor Transaction
  async executeActivityTransactionForTest(custodialWallets: CustodialWallet[]) {
    const results: ActivityTestResponse[] = [];
    const suiClient = new SuiClient({
      url: process.env.SUI_NETWORK || "http://localhost",
    });

    console.log({ chain: process.env.SUI_NETWORK });

    for (let idx = 0; idx < custodialWallets.length; idx++) {
      const tx = new Transaction();
      tx.moveCall({
        target: `${process.env.PACKAGE_ADDRESS}::campaign::log_user_activity`,
        arguments: [
          tx.object(`${process.env.CAMPAIGN_ADMIN_CAP_ADDRESS}`), // campaign admincap object address
          tx.object(`${process.env.CAMPAIGN_OBJECT_ADDRESS}`), // campaign object address
          tx.object("0x6"), // Clock object address
        ],
      });

      const { digest } = await sponsorAndSignTransaction({
        tx,
        suiClient,
        custodialSecretKey: custodialWallets[idx].secretKey,
      });

      results.push({
        address: custodialWallets[idx].address,
        digest: digest!,
      });
    }

    return results;
  }
}

export const analyticsController = new AnalyticsController();
