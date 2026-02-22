"use client";

import { useState, useCallback, useRef } from "react";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

const FUND_AMOUNT = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL for tx fees

export function useEphemeralKeypair() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const keypairRef = useRef<Keypair | null>(null);
  const [ready, setReady] = useState(false);
  const [funding, setFunding] = useState(false);

  const setup = useCallback(async () => {
    if (!publicKey) return;
    if (keypairRef.current) {
      setReady(true);
      return;
    }

    setFunding(true);
    try {
      const kp = Keypair.generate();
      keypairRef.current = kp;

      // Fund the ephemeral keypair from wallet (one popup)
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: kp.publicKey,
          lamports: FUND_AMOUNT,
        })
      );

      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setReady(true);
    } catch (err) {
      console.error("Failed to fund ephemeral keypair:", err);
      keypairRef.current = null;
    } finally {
      setFunding(false);
    }
  }, [publicKey, connection, sendTransaction]);

  return {
    keypair: keypairRef.current,
    ready,
    funding,
    setup,
  };
}
