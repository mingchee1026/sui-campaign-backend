import { User } from "@/api/user/userModel";
import { unknown } from "zod";
import type { Jwt, UserResponse } from "./userInterface";
export class UserRepository {
  async create(newUser: UserResponse) {
    const user = new User(newUser);
    const result = await user.save();
    return user;
  }

  async updateJwt(
    campaign_id: string,
    subject: string,
    custodial_address: string,
    jwt: Jwt,
    // referred_by: string
  ): Promise<UserResponse | null> {
    const user = await User.findOne({ campaign_id, subject });
    if (user) {
      user.custodial_address = custodial_address;
      user.jwt = jwt;
      // user.referred_by = referred_by;

      return await user.save();
    }
    return null;
  }

  async findAll() {
    return User.find();
  }

  async findAllByCode(attribution_code: string) {
    return await User.find({ referred_by: attribution_code });
  }

  async findBySubject(campaign_id: string, subject: string): Promise<UserResponse | null> {
    return await User.findOne({ campaign_id, subject });
  }

  async findByAttributionCode(campaign_id: string, attribution_code: string): Promise<UserResponse | null> {
    return await User.findOne({ campaign_id, attribution_code });
  }
}
