import { CustodialwalletRepository } from "./custodialwalletRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { CustodialWallet } from "../custodialWallet/custodialwalletModel";
import { IcustodialWallet } from "./custodialwalletInterface";

export class CustodialwalletService {
  private repository: CustodialwalletRepository;

  constructor(
    repository: CustodialwalletRepository = new CustodialwalletRepository()
  ) {
    this.repository = repository;
  }

  async getCustodialWallets(): Promise<
    ServiceResponse<IcustodialWallet[] | null>
  > {
    const custodialWallets = await this.repository.findAll();

    return ServiceResponse.success("All Sponsors wallets", custodialWallets);
  }

  async getCustodialWallet(
    campaign_id: string,
    subject: string
  ): Promise<IcustodialWallet | null> {
    const custodialWallet = await this.repository.findOneBySubject(
      campaign_id,
      subject
    );

    return custodialWallet;
  }
}

export const custodialwalletService = new CustodialwalletService();
