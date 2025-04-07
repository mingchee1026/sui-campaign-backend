import type { SuiClient } from "@mysten/sui/client";
import {
  decodeSuiPrivateKey,
  encodeSuiPrivateKey,
} from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromB64, fromHEX, toB64 } from "@mysten/sui/utils";
import { enokiClient } from "./getEnokiClient";
import { getKeypair } from "./getKeyPair";
import { EnokiNetwork } from "@mysten/enoki/dist/cjs/EnokiClient/type";
import { Logger } from "pino";
import { logger } from "@/server";

interface SponsorAndSignTransactionProps {
  suiClient: SuiClient;
  tx: Transaction;
  senderSecretKey: string;
  isRegister: boolean;
}

export const sponsorAndSignTransaction = async ({
  tx,
  suiClient,
  senderSecretKey,
  isRegister,
}: SponsorAndSignTransactionProps) => {
  let testAdd = "";
  try {
    // logger.info(`custodialSecretKey: ${custodialSecretKey}`);

    const { schema, secretKey } = decodeSuiPrivateKey(senderSecretKey);
    const senderKeypair = Ed25519Keypair.fromSecretKey(secretKey);
    const senderAddress = senderKeypair.getPublicKey().toSuiAddress();

    // for testing
    testAdd = senderAddress;

    // logger.info(`Sender Address: ${senderAddress}`);

    const txBytes = await tx.build({
      client: suiClient,
      onlyTransactionKind: true,
    });

    // console.log({ txBytes });

    const network = process.env.ENOKI_CLIENT_NETWORK;

    // logger.info(`Network: ${network}`);

    // const st1 = performance.now();

    const resp = await enokiClient.createSponsoredTransaction({
      network: network as EnokiNetwork,
      transactionKindBytes: toB64(txBytes),
      sender: senderAddress,
      allowedMoveCallTargets: [
        `${process.env.PACKAGE_ADDRESS}::campaign::add_whitelist`,
        `${process.env.PACKAGE_ADDRESS}::campaign::log_user_activity`,
        `${process.env.PACKAGE_ADDRESS}::campaign::create_referral`,
      ],
      allowedAddresses: [senderAddress],
    });

    const { signature } = await senderKeypair.signTransaction(
      fromB64(resp.bytes)
    );

    // const et1 = performance.now();
    // logger.info(`Tx creating time: ${et1 - st1} milliseconds`);

    // console.log({ signature });

    // const st2 = performance.now();

    if (isRegister) {
      const { digest } = await enokiClient.executeSponsoredTransaction({
        digest: resp.digest,
        signature,
      });

      return { digest };
    }

    enokiClient
      .executeSponsoredTransaction({
        digest: resp.digest,
        signature,
      })
      .then(async (res: any) => {
        logger.info(`Results: -------------------- ${res.digest}`);
      })
      .catch((error: any) => {
        logger.info(`Error: -------------------- ${error}`);
      });

    // const et2 = performance.now();
    // logger.info(`Tx executing time: ${et2 - st2} milliseconds`);

    // logger.info(`digest: ${digest}`);

    return {
      // digest,
      digest: resp.digest,
    };
  } catch (error: any) {
    logger.error(`Sender: ${testAdd}: ${error}`); //error(`Error: ${error.message || error}`);
    return {
      digest: null,
    };
  }
};

export const sponsorAndSignTransactionRaw = async ({
  tx,
  suiClient,
  senderSecretKey,
}: SponsorAndSignTransactionProps) => {
  try {
    console.log({ senderSecretKey });
    const { schema, secretKey } = decodeSuiPrivateKey(senderSecretKey);
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

    let sponsorCoins: { objectId: string; version: string; digest: string }[] =
      [];

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
    sponsoredtx.setGasBudget(100000000);
    sponsoredtx.setGasPayment(sponsorCoins);

    const sponsoredTxnBuild = await sponsoredtx.build({ client: suiClient });
    const sponsoredSignedTxn = await sponsorKeypair.signTransaction(
      sponsoredTxnBuild
    );

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
