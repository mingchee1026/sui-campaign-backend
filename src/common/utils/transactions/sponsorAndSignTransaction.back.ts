import type { SuiClient } from "@mysten/sui/client";
import { decodeSuiPrivateKey, encodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromB64, fromHEX } from "@mysten/sui/utils";
import { getKeypair } from "./getKeyPair";

interface SponsorAndSignTransactionProps {
  suiClient: SuiClient;
  tx: Transaction;
  ephemeralAddress: string;
  sponsorSecretKey: string;
}

export const sponsorAndSignTransaction = async ({
  tx,
  suiClient,
  ephemeralAddress,
  sponsorSecretKey,
}: SponsorAndSignTransactionProps) => {
  try {
    console.log({ sponsorSecretKey });
    const { schema, secretKey } = decodeSuiPrivateKey(sponsorSecretKey);
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(secretKey);
    // const sponsorKeypair = getKeypair(sponsorSecretKey);
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

    let sponsorCoins: { objectId: string; version: string; digest: string }[] = [];

    const coins = await suiClient.getCoins({
      owner: sponserAddress,
      limit: 10,
    });
    console.log({ coins: coins.data });
    if (coins.data.length > 0) {
      sponsorCoins = coins.data.map((coin) => ({
        objectId: coin.coinObjectId,
        version: coin.version,
        digest: coin.digest,
      }));
    }

    // you can now set the sponsored transaction data that is required
    sponsoredtx.setSender(ephemeralAddress);
    sponsoredtx.setGasOwner(sponserAddress);
    sponsoredtx.setGasBudget(10000000);
    sponsoredtx.setGasPayment(sponsorCoins);

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

export const sponsorAndSignTransaction1 = async ({
  tx,
  suiClient,
  ephemeralAddress,
  sponsorSecretKey,
}: SponsorAndSignTransactionProps) => {
  try {
    console.log({ sponsorSecretKey });
    const { schema, secretKey } = decodeSuiPrivateKey(sponsorSecretKey);
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(secretKey);
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

    let sponsorCoins: { objectId: string; version: string; digest: string }[] = [];

    const coins = await suiClient.getCoins({
      owner: sponserAddress,
      limit: 10,
    });

    console.log({ coins: coins.data });

    if (coins.data.length > 0) {
      sponsorCoins = coins.data.map((coin) => ({
        objectId: coin.coinObjectId,
        version: coin.version,
        digest: coin.digest,
      }));
    }

    // you can now set the sponsored transaction data that is required
    sponsoredtx.setSender(sponserAddress);
    sponsoredtx.setGasOwner(sponserAddress);
    sponsoredtx.setGasBudget(10000000);
    sponsoredtx.setGasPayment(sponsorCoins);

    const sponsoredTxnBuild = await sponsoredtx.build({ client: suiClient });
    const sponsoredSignedTxn = await sponsorKeypair.signTransaction(sponsoredTxnBuild);

    suiClient
      .executeTransactionBlock({
        transactionBlock: sponsoredSignedTxn.bytes,
        signature: [sponsoredSignedTxn.signature],
        requestType: "WaitForLocalExecution",
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      })
      .then(async (res: any) => {
        // console.log({ res });
        const status = res?.effects?.status.status;
        if (status !== "success") {
          console.log("Activity Transaction failed: executeTransactionBlock");
          return {
            txDigest: null,
          };
        }

        console.log({ txDigest: res.effects?.transactionDigest! });

        return {
          txDigest: res.effects?.transactionDigest!,
        };
      })
      .catch((error: any) => {
        console.error({ error });
        return {
          txDigest: null,
        };
      });
  } catch (error) {
    console.log(error);
    return {
      txDigest: null,
    };
  }
};
