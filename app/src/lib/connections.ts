import { Connection } from "@solana/web3.js";
import { ConnectionMagicRouter } from "@magicblock-labs/ephemeral-rollups-sdk";
import { DEVNET_RPC, ER_RPC, ER_WS, MAGIC_ROUTER_RPC, MAGIC_ROUTER_WS } from "./constants";

// L1 connection for initialization and reading
export const l1Connection = new Connection(DEVNET_RPC, "confirmed");

// Direct ER connection for pixel placement and WebSocket subscriptions
export const erConnection = new Connection(ER_RPC, {
  wsEndpoint: ER_WS,
  commitment: "processed",
});

// Magic Router singleton (auto-routes delegated vs non-delegated)
let routerInstance: ConnectionMagicRouter | null = null;

export function getRouterConnection(): ConnectionMagicRouter {
  if (!routerInstance) {
    routerInstance = new ConnectionMagicRouter(MAGIC_ROUTER_RPC, {
      wsEndpoint: MAGIC_ROUTER_WS,
      commitment: "confirmed",
    });
  }
  return routerInstance;
}
