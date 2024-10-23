export interface Jwt {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  nonce: string;
  nbf: number;
  name: string;
  picture: string;
  given_name: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface IUser {
  campaign_id: string;
  subject: string;
  email: string;
  wallet_address: string;
  custodial_address: string;
  attribution_code: string;
  referred_by: string;
  user_name: string;
  avatar: string;
}

export interface UserRegisterRequest {
  campaign_id: string;
  wallet_address: string;
  referred_by: string;
}

export interface UserRegisterResponse {
  user: IUser;
  digest: string | null;
}
