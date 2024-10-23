import { ServiceResponse } from "@/common/models/serviceResponse";
import { CustodialWallet } from "./custodialwalletModel";
import type { IcustodialWallet } from "./custodialwalletInterface";

export class CustodialwalletRepository {
  async create(newWallet: IcustodialWallet): Promise<IcustodialWallet | null> {
    const wallet = new CustodialWallet(newWallet);
    const result = await wallet.save();
    return result;
  }

  async update(
    campaign_id: string,
    subject: string,
    custodial_address: string
  ): Promise<IcustodialWallet | null> {
    const wallet = await CustodialWallet.findOne({
      address: custodial_address,
    });

    if (wallet) {
      wallet.campaign_id = campaign_id;
      wallet.subject = subject;

      const result = await wallet.save();
      return result;
    }

    return null;
  }

  async findOneByAddress(address: string): Promise<IcustodialWallet | null> {
    const custodialWallet = await CustodialWallet.findOne({ address });
    return custodialWallet;
  }

  async findOneBySubject(
    campaign_id: string,
    subject: string
  ): Promise<IcustodialWallet | null> {
    let custodialWallet = await CustodialWallet.findOne({
      campaign_id,
      subject,
    });

    if (!custodialWallet) {
      custodialWallet = await CustodialWallet.findOne({
        campaign_id: "",
        subject: "",
      });

      if (custodialWallet) {
        custodialWallet.campaign_id = campaign_id;
        custodialWallet.subject = subject;

        custodialWallet = await custodialWallet.save();
      }
    }

    return custodialWallet;
  }

  async findAll(): Promise<IcustodialWallet[]> {
    const custodialWallets = await CustodialWallet.find();
    return custodialWallets;
  }

  async countByEmpty(): Promise<number> {
    const ret = await CustodialWallet.countDocuments({
      campaign_id: "",
      subject: "",
    });
    return ret;
  }
}
