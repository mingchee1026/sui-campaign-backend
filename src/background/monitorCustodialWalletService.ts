import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { CustodialwalletRepository } from "@/api/custodialWallet/custodialwalletRepository";
import { CustodialWallet } from "@/api/custodialWallet/custodialwalletModel";
import { CronJob } from "cron";
import { CronExpression } from "@/common/utils/cron-expression.enum";
import { logger } from "@/server";

class MonitorCustodialWalletService {
  private cronJob: CronJob;
  private repository: CustodialwalletRepository;

  constructor(
    repository: CustodialwalletRepository = new CustodialwalletRepository()
  ) {
    this.repository = repository;

    this.cronJob = new CronJob(CronExpression.EVERY_10_SECONDS, async () => {
      try {
        await this.processCustodialWallet();
      } catch (e) {
        console.error(e);
      }
    });
  }

  async onStartMonitor() {
    // Start job
    logger.info("Starting cron job...");
    if (!this.cronJob.running) {
      this.cronJob.start();
    }
  }

  async onStopMonitor() {
    // Stop job
    logger.info("Stopping cron job...");
    if (this.cronJob.running) {
      this.cronJob.stop();
    }
  }

  async processCustodialWallet() {
    let count = 0;

    const availableCounts = await this.repository.countByEmpty();
    if (availableCounts < 100) {
      const sponsorWalletCount = Number.parseInt(
        process.env.SPONSOR_WALLET_COUNT || "50"
      );

      for (let idx = 0; idx < sponsorWalletCount; idx++) {
        try {
          const keypair = new Ed25519Keypair();
          const secretKey = keypair.getSecretKey();
          const publicKey = keypair.getPublicKey();
          const address = publicKey.toSuiAddress();

          const result = await this.repository.create({
            campaign_id: "",
            subject: "",
            address,
            secretKey,
            publicKey,
          });
          count++;
        } catch (error) {
          console.log(`createSponsorWallets error: index=${idx} => ${error}`);
        }
      }
    }

    // logger.info(`Processed wallets: ${count} `);

    return count;
  }
}

export const monitorCustodialWalletService =
  new MonitorCustodialWalletService();
