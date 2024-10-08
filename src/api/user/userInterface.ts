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

export interface RegisterUserRequest {
  campaign_id: string;
  wallet_address: string;
  wallet_keypair: string;
  salt: string;
  jwt: Jwt;
  referred_by: string;
}

export interface UserResponse {
  campaign_id: string;
  subject: string;
  email: string;
  salt: string;
  wallet_address: string;
  custodial_address: string;
  attribution_code: string;
  referred_by: string;
  user_name: string;
  avatar: string;
  jwt: Jwt;
}

export interface ISponsorWallet {
  campaign_id: string;
  subject: string;
  address: string;
  secretKey: string;
  publicKey: string;
}
