export interface IcustodialWallet {
  campaign_id?: string | null | undefined;
  subject?: string | null | undefined;
  address?: string | null | undefined;
  secretKey?: string | null | undefined;
  publicKey?: any;
  createdAt?: NativeDate;
}

export interface IWhiteList {
  campaign_id?: string | null | undefined;
  address?: string | null | undefined;
  permission?: boolean | null | undefined;
}
