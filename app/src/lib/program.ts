import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { PROGRAM_ID, CANVAS_SEED } from "./constants";
import idl from "../../idl/solplace.json";

export function getProgram(
  connection: Connection,
  wallet: AnchorWallet
): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

export function getCanvasPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CANVAS_SEED], PROGRAM_ID);
}
