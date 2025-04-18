import { User } from "@/api/user/userModel";
import type { IUser } from "./userInterface";
import { WhiteList } from "../custodialWallet/whitelistModel";
export class UserRepository {
  async create(newUser: IUser) {
    const user = new User(newUser);
    const result = await user.save();
    return user;
  }

  async updateCustodialAddress(
    campaign_id: string,
    subject: string,
    custodial_address: string
    // referred_by: string
  ) {
    const user = await User.findOne({ campaign_id, subject });
    if (user) {
      user.custodial_address = custodial_address;

      return await user.save();
    }
    return null;
  }

  async updateReferredBy(
    campaign_id: string,
    subject: string,
    // custodial_address: string
    referred_by: string
  ) {
    const user = await User.findOne({ campaign_id, subject });
    if (user) {
      user.referred_by = referred_by;

      return await user.save();
    }
    return null;
  }

  async updateCallCount(
    campaign_id: string,
    subject: string,
    callCount: number
  ) {
    const user = await User.findOne({ campaign_id, subject });
    if (user) {
      user.callCount = callCount;

      return await user.save();
    }
    return null;
  }

  async updateCallLimit(
    campaign_id: string,
    subject: string,
    callCount: number,
    lastReset: number
  ) {
    const user = await User.findOne({ campaign_id, subject });
    if (user) {
      user.callCount = callCount;
      user.lastReset = lastReset;

      return await user.save();
    }
    return null;
  }

  async updateCampId(campaign_id: string) {
    await User.updateMany({}, { campaign_id });
  }

  async findAll(): Promise<IUser[]> {
    return User.find();
  }

  async findAllByCode(attribution_code: string): Promise<IUser[]> {
    return await User.find({ referred_by: attribution_code });
  }

  async countByCode(attribution_code: string) {
    return await User.countDocuments({ referred_by: attribution_code });
  }

  async findBySubject(
    campaign_id: string,
    subject: string
  ): Promise<IUser | null> {
    return await User.findOne({ campaign_id, subject });
  }

  async findByCustodialAddress(
    custodial_address: string
  ): Promise<IUser | null> {
    return await User.findOne({ custodial_address });
  }

  async findByPublicKey(
    campaign_id: string,
    publicKey: string
  ): Promise<IUser | null> {
    return await User.findOne({ campaign_id, publicKey });
  }

  async findByAttributionCode(
    campaign_id: string,
    attribution_code: string
  ): Promise<IUser | null> {
    return await User.findOne({ campaign_id, attribution_code });
  }

  async removeAll() {
    return User.deleteMany({});
  }
}
