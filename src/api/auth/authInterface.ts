export interface GetSaltRequest {
  jwt: string;
  subject: string;
  salt: string;
}

export interface GetSaltResponse {
  subject: string;
  salt: string;
}
