import { User } from "@/api/user/userModel";
import type { IUser } from "./userInterface";
export class UserRepository {
  async create(newUser: IUser) {
    const user = new User(newUser);
    const result = await user.save();
    return user;
  }

  async update(
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
