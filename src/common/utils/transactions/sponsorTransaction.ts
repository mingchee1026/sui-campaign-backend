import { Transaction } from "@mysten/sui/transactions";

interface SponsorTransactionProps {
  txBytes: Uint8Array;
  sender: string;
  sponserAddress: string;
  forceFailure?: boolean;
}

export const sponsorTransaction = async ({
  txBytes,
  sender,
  sponserAddress,
  forceFailure = false,
}: SponsorTransactionProps) => {
  // construct a sponsored transaction from the kind bytes
  const sponsoredtx = Transaction.fromKind(txBytes);

  // you can now set the sponsored transaction data that is required
  sponsoredtx.setSender(sender);
  sponsoredtx.setGasOwner(sponserAddress);
  // sponsoredtx.setGasPayment(sponsorCoins);

  return sponsoredtx;
};
