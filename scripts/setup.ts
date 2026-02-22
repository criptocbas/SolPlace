/**
 * SolPlace Setup Script
 *
 * 1. Initialize the canvas on L1
 * 2. Delegate the canvas to the ER
 * 3. Verify delegation
 * 4. Test pixel placement via ER
 *
 * Usage: npx ts-node scripts/setup.ts
 */

import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import fs from "fs";
import path from "path";

const PROGRAM_ID = new PublicKey(
  "CQCS2S6uj46VD2WEScxJLSWWNB8zYUppUHNS5GecMU8J"
);
const DELEGATION_PROGRAM_ID = new PublicKey(
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
);
const CANVAS_SEED = Buffer.from("canvas");
const DEVNET_RPC = "https://api.devnet.solana.com";
const ER_RPC = "https://devnet.magicblock.app/";

async function main() {
  // Load wallet
  const walletPath =
    process.env.ANCHOR_WALLET ||
    path.join(process.env.HOME!, ".config/solana/id.json");
  const rawKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(rawKey));

  console.log("Wallet:", payer.publicKey.toBase58());

  // Load IDL
  const idlPath = path.join(__dirname, "../target/idl/solplace.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  // L1 connection
  const l1Connection = new Connection(DEVNET_RPC, "confirmed");
  const l1Wallet = new anchor.Wallet(payer);
  const l1Provider = new anchor.AnchorProvider(l1Connection, l1Wallet, {
    commitment: "confirmed",
  });
  const l1Program = new anchor.Program(idl, l1Provider);

  // Derive canvas PDA
  const [canvasPda] = PublicKey.findProgramAddressSync(
    [CANVAS_SEED],
    PROGRAM_ID
  );
  console.log("Canvas PDA:", canvasPda.toBase58());

  // Check balance
  const balance = await l1Connection.getBalance(payer.publicKey);
  console.log("Balance:", balance / LAMPORTS_PER_SOL, "SOL");

  // Step 1: Initialize canvas
  const existingAccount = await l1Connection.getAccountInfo(canvasPda);
  if (existingAccount) {
    console.log("Canvas already initialized, skipping...");
  } else {
    console.log("Initializing canvas...");
    const tx = await l1Program.methods
      .initializeCanvas()
      .accounts({
        authority: payer.publicKey,
      })
      .rpc();
    console.log("Canvas initialized:", tx);
  }

  // Step 2: Delegate canvas to ER
  const accountInfo = await l1Connection.getAccountInfo(canvasPda);
  if (accountInfo?.owner.equals(DELEGATION_PROGRAM_ID)) {
    console.log("Canvas already delegated, skipping...");
  } else {
    console.log("Delegating canvas to ER...");
    const tx = await l1Program.methods
      .delegateCanvas()
      .accounts({
        authority: payer.publicKey,
      })
      .rpc();
    console.log("Canvas delegated:", tx);

    // Wait for delegation to propagate
    console.log("Waiting 5 seconds for delegation to propagate...");
    await new Promise((r) => setTimeout(r, 5000));
  }

  // Step 3: Verify delegation
  const delegatedAccount = await l1Connection.getAccountInfo(canvasPda);
  if (delegatedAccount?.owner.equals(DELEGATION_PROGRAM_ID)) {
    console.log("Delegation verified! Owner is delegation program.");
  } else {
    console.log(
      "WARNING: Account owner is",
      delegatedAccount?.owner.toBase58()
    );
  }

  // Step 4: Test pixel placement via ER
  console.log("Testing pixel placement via ER...");
  const erConnection = new Connection(ER_RPC, "confirmed");
  const erProvider = new anchor.AnchorProvider(erConnection, l1Wallet, {
    commitment: "processed",
  });
  const erProgram = new anchor.Program(idl, erProvider);

  try {
    const tx = await erProgram.methods
      .placePixel(0, 0, 2) // Red pixel at (0,0)
      .accounts({
        painter: payer.publicKey,
        canvas: canvasPda,
      })
      .rpc();
    console.log("Pixel placed:", tx);
  } catch (e) {
    console.error("Pixel placement failed:", e);
  }

  console.log("\nSetup complete!");
  console.log("Run the frontend: cd app && npm run dev");
}

main().catch(console.error);
