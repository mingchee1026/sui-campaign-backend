import type { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromB64 } from "@mysten/sui/utils";
import { getKeypair } from "./getKeyPair";

interface SponsorAndSignTransactionProps {
  suiClient: SuiClient;
  tx: Transaction;
  ephemeralAddress: string;
  ephemeralKeyPairB64: string;
}

export const sponsorAndSignTransaction = async ({
  tx,
  suiClient,
  ephemeralAddress,
  ephemeralKeyPairB64,
}: SponsorAndSignTransactionProps) => {
  try {
    // const sponsorKeypair = Ed25519Keypair.deriveKeypairFromSeed(
    //   process.env.SPONSOR_SECRET_KEY!
    // );
    const sponsorKeypair = getKeypair(process.env.SPONSOR_SECRET_KEY!);
    // const sponsorKeypair = getKeypair(process.env.SPONSOR_SECRET_KEY!);
    const sponserAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    console.log({ sponserAddress });

    const kindBytes = await tx.build({
      client: suiClient,
      onlyTransactionKind: true,
    });
    console.log({ kindBytes });

    // construct a sponsored transaction from the kind bytes
    const sponsoredtx = Transaction.fromKind(kindBytes);
    console.log({ sponsoredtx });

    const coins = await suiClient.getCoins({
      owner: sponserAddress,
      limit: 10,
    });
    console.log({ coins: coins.data });

    // you can now set the sponsored transaction data that is required
    sponsoredtx.setSender(ephemeralAddress);
    sponsoredtx.setGasOwner(sponserAddress);
    // sponsoredtx.setGasPayment(sponsorCoins);

    const sponsoredTxnBuild = await sponsoredtx.build({ client: suiClient });
    const sponsoredSignedTxn = await sponsorKeypair.signTransaction(sponsoredTxnBuild);

    // const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(
    //   fromB64(ephemeralKeyPairB64)
    // );
    // console.log({
    //   ephemeralKey: ephemeralKeyPair.getPublicKey().toSuiAddress(),
    // });
    // const userSignedTxn = await ephemeralKeyPair.signTransaction(
    //   sponsoredTxnBuild
    // );

    // return {
    //   sponsoredSignedTxn,
    //   userSignedTxn,
    // };
    return {
      sponsoredSignedTxn,
      sponsoredtx,
    };
  } catch (error) {
    console.log(error);
    return {
      sponsoredSignedTxn: null,
      sponsoredtx: null,
    };
  }
};
