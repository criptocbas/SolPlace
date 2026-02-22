import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "CQCS2S6uj46VD2WEScxJLSWWNB8zYUppUHNS5GecMU8J"
);

export const DELEGATION_PROGRAM_ID = new PublicKey(
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
);

// RPC Endpoints
export const DEVNET_RPC = "https://api.devnet.solana.com";
export const ER_RPC = "https://devnet.magicblock.app/";
export const ER_WS = "wss://devnet.magicblock.app/";
export const MAGIC_ROUTER_RPC = "https://devnet-router.magicblock.app/";
export const MAGIC_ROUTER_WS = "wss://devnet-router.magicblock.app/";

// PDA Seeds
export const CANVAS_SEED = Buffer.from("canvas");

// Canvas dimensions
export const CANVAS_WIDTH = 64;
export const CANVAS_HEIGHT = 64;
export const PIXEL_SIZE = 10; // px per pixel on screen

// Account data offset: 8 byte discriminator
export const DISCRIMINATOR_SIZE = 8;

// Canvas account field offsets (zero_copy, repr(C))
// 8 (disc) + 32 (authority) + 1 (width) + 1 (height) + 6 (padding) + 32 (last_editor) + 8 (pixel_count) + 4096 (pixels)
export const PIXELS_OFFSET = DISCRIMINATOR_SIZE + 32 + 1 + 1 + 6 + 32 + 8;
export const PIXEL_COUNT_OFFSET = DISCRIMINATOR_SIZE + 32 + 1 + 1 + 6 + 32;
