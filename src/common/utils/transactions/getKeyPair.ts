import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";

export const getKeypair = (secretKey: string) => {
  const privateKeyArray = Uint8Array.from(Array.from(fromB64(secretKey)));
  const keypairAdmin = Ed25519Keypair.fromSecretKey(privateKeyArray.slice(1));
  return keypairAdmin;
};
