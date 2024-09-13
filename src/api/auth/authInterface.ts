export interface GetSaltRequest {
  jwt: string;
  subject: string;
}

export interface GetSaltResponse {
  subject: string;
  salt: string;
}
