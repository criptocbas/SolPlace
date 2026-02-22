"use client";

import { useCallback, useRef, useEffect } from "react";
import { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram, getCanvasPDA } from "@/lib/program";
import { erConnection } from "@/lib/connections";

// Dummy wallet for Anchor program instantiation (we sign manually)
const dummyWallet: AnchorWallet = {
  publicKey: Keypair.generate().publicKey,
  signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => tx,
  signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => txs,
};

export function usePixelPlace() {
  const blockhashRef = useRef<string>("");
  const canvasPdaRef = useRef(getCanvasPDA()[0]);

  // Cache blockhash, refresh every 15s
  useEffect(() => {
    const refresh = async () => {
      try {
        const { blockhash } = await erConnection.getLatestBlockhash("processed");
        blockhashRef.current = blockhash;
      } catch (e) {
        console.error("Failed to refresh blockhash:", e);
      }
    };

    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, []);

  const placePixel = useCallback(
    async (x: number, y: number, color: number, keypair: Keypair) => {
      const program = getProgram(erConnection, dummyWallet);

      const tx = await program.methods
        .placePixel(x, y, color)
        .accounts({
          painter: keypair.publicKey,
          canvas: canvasPdaRef.current,
        })
        .transaction();

      tx.recentBlockhash = blockhashRef.current;
      tx.feePayer = keypair.publicKey;
      tx.sign(keypair);

      // Fire and forget
      erConnection
        .sendRawTransaction(tx.serialize(), { skipPreflight: true })
        .catch((e) => console.error("place_pixel tx failed:", e));
    },
    []
  );

  return { placePixel };
}
