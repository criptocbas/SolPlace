# SolPlace

Real-time collaborative pixel canvas on Solana. Every pixel is an on-chain transaction processed in sub-50ms via [MagicBlock](https://www.magicblock.gg/) Ephemeral Rollups.

Inspired by Reddit's r/place — but fully on-chain and verifiable.

**Try it live:** [solplace-phi.vercel.app](https://solplace-phi.vercel.app/)

![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana&logoColor=white)
![MagicBlock](https://img.shields.io/badge/MagicBlock-Ephemeral%20Rollups-00D18C)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Anchor](https://img.shields.io/badge/Anchor-0.32-blue)

---

## How It Works

```
User clicks pixel  -->  Optimistic UI update (instant)
                   -->  place_pixel tx sent to Ephemeral Rollup (~10-50ms)
                   -->  WebSocket pushes state to all connected clients
                   -->  Canvas re-renders with flash effect
```

SolPlace uses **MagicBlock Ephemeral Rollups** (ERs) — temporary, on-demand, high-speed execution environments native to Solana:

- **10-50ms latency** (vs Solana L1's ~400ms)
- **Zero transaction fees** inside the ER
- **Full L1 composability** — no bridges, no new tokens
- **Fraud-proof security** with time-bound delegations

The canvas account is created on Solana L1, then **delegated** to an Ephemeral Rollup where all pixel placements happen at gaming speed. State is periodically committed back to L1 for finality.

---

## Features

**Core**
- 64x64 pixel canvas with 16-color curated palette
- Every pixel placement is a verifiable on-chain transaction
- Real-time sync across all clients via WebSocket
- Live activity feed with pixel-diff detection
- Ephemeral keypair system — one wallet popup, then draw freely

**UX Polish**
- Canvas zoom (1-5x) with scroll wheel + cursor-centered pan
- Minimap overlay when zoomed for quick navigation
- Keyboard shortcuts for color selection (1-9, 0, Q-Y)
- Audio feedback — subtle blip sound on each placement
- Auto-start drawing on wallet connect (no extra clicks)
- Onboarding overlay for new/disconnected users
- 500ms cooldown indicator between placements
- Session pixel counter
- Download canvas as high-res PNG
- Share to X (Twitter) with auto-downloaded screenshot
- Connection status indicator (green/red/yellow dot)
- Optimistic updates with flash effects on remote changes
- Dark theme with subtle noise texture

---

## Architecture

```
solplace/
├── programs/solplace/           # Anchor program (on-chain)
│   └── src/
│       ├── lib.rs               # Program entry with #[ephemeral] macro
│       ├── state.rs             # Canvas account (64x64 grid, zero_copy)
│       ├── errors.rs            # Custom error codes
│       └── instructions/
│           ├── initialize_canvas.rs   # Create canvas on L1
│           ├── delegate_canvas.rs     # Delegate to ER
│           ├── place_pixel.rs         # Hot path (runs in ER)
│           ├── commit_canvas.rs       # Snapshot state to L1
│           └── undelegate_canvas.rs   # Commit + return to L1
│
├── app/                          # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx          # Main UI
│       │   ├── layout.tsx        # Root layout
│       │   └── globals.css       # Dark theme
│       ├── components/
│       │   ├── Canvas.tsx        # HTML5 canvas with zoom/pan
│       │   ├── Header.tsx        # Wallet + status bar
│       │   ├── ColorPalette.tsx  # 16-color selector
│       │   └── ActivityFeed.tsx  # Live pixel log
│       ├── hooks/
│       │   ├── useCanvas.ts     # State + WebSocket subscription
│       │   ├── usePixelPlace.ts # Send place_pixel txs to ER
│       │   ├── useEphemeralKeypair.ts  # Generate + fund temp keypair
│       │   └── useConnectionStatus.ts  # ER health check
│       └── lib/
│           ├── constants.ts     # Program ID, RPCs, seeds
│           ├── colors.ts        # Palette definitions
│           ├── program.ts       # Anchor program instance
│           └── connections.ts   # L1 + ER + Router connections
│
├── Anchor.toml
└── Cargo.toml
```

### On-Chain Program

**Program ID:** `CQCS2S6uj46VD2WEScxJLSWWNB8zYUppUHNS5GecMU8J`

The canvas state is a single zero-copy account:

```rust
#[account(zero_copy)]
#[repr(C)]
pub struct Canvas {
    pub authority: Pubkey,       // Who initialized
    pub width: u8,               // 64
    pub height: u8,              // 64
    pub _padding: [u8; 6],
    pub last_editor: Pubkey,     // Last painter
    pub pixel_count: u64,        // Total placements
    pub pixels: [u8; 4096],      // 64x64 grid (1 byte per pixel)
}
```

**Instructions:**

| Instruction | Layer | Purpose |
|---|---|---|
| `initialize_canvas` | L1 | Create the canvas PDA |
| `delegate_canvas` | L1 | Transfer ownership to Ephemeral Rollup |
| `place_pixel(x, y, color)` | ER | Set a pixel (the hot path) |
| `commit_canvas` | ER | Snapshot state back to L1 |
| `undelegate_canvas` | ER | Commit + return to L1 control |

### Delegation Lifecycle

```
L1: initialize_canvas()  -->  Canvas created on Solana
L1: delegate_canvas()    -->  Ownership transferred to ER  (~3-10s propagation)
ER: place_pixel() x N    -->  Sub-50ms pixel placements (zero fees)
ER: commit_canvas()      -->  Snapshot to L1 (canvas stays delegated)
ER: undelegate_canvas()  -->  Final commit + return to L1
```

### Frontend Stack

- **Next.js 16** with App Router
- **React 19** with hooks-based state management
- **Tailwind CSS v4** dark theme
- **@solana/wallet-adapter** for wallet connection
- **@coral-xyz/anchor** for program interaction
- **@magicblock-labs/ephemeral-rollups-sdk** for delegation + routing

### Connections

| Connection | Endpoint | Purpose |
|---|---|---|
| L1 | `api.devnet.solana.com` | Wallet balance, initialization |
| ER (direct) | `devnet.magicblock.app` | Pixel placement, WebSocket subscriptions |
| Magic Router | `devnet-router.magicblock.app` | Auto-routes based on delegation status |

---

## User Flow

1. **Connect wallet** — select Phantom, Backpack, etc.
2. **Auto-setup** — an ephemeral keypair is generated and funded with 0.01 SOL automatically (one wallet popup)
3. **Pick a color** — 16-color palette or keyboard shortcuts (1-9, 0, Q-Y)
4. **Click pixels** — each click sends a `place_pixel` tx to the ER, signed by the ephemeral keypair (no popups)
5. **See changes** — all clients update in real-time via WebSocket

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) + [Solana CLI](https://docs.solanalabs.com/cli/install)
- [Anchor](https://www.anchor-lang.com/docs/installation) 0.32+
- A Solana wallet browser extension with devnet SOL

### Run the Frontend

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The program is already deployed on devnet — the frontend connects to it automatically.

### Deploy the Program (optional)

```bash
# Build
anchor build

# Deploy to devnet
anchor deploy

# Initialize canvas (one-time)
# Call initialize_canvas then delegate_canvas via the program
```

---

## Color Palette

| Index | Color | Hex | Name |
|---|---|---|---|
| 0 | ![#1a1a1a](https://via.placeholder.com/12/1a1a1a/1a1a1a.png) | `#1a1a1a` | Void |
| 1 | ![#e8e8e8](https://via.placeholder.com/12/e8e8e8/e8e8e8.png) | `#e8e8e8` | White |
| 2 | ![#e84040](https://via.placeholder.com/12/e84040/e84040.png) | `#e84040` | Red |
| 3 | ![#40c463](https://via.placeholder.com/12/40c463/40c463.png) | `#40c463` | Green |
| 4 | ![#4078e8](https://via.placeholder.com/12/4078e8/4078e8.png) | `#4078e8` | Blue |
| 5 | ![#e8d44a](https://via.placeholder.com/12/e8d44a/e8d44a.png) | `#e8d44a` | Yellow |
| 6 | ![#c850c0](https://via.placeholder.com/12/c850c0/c850c0.png) | `#c850c0` | Magenta |
| 7 | ![#50d0d0](https://via.placeholder.com/12/50d0d0/50d0d0.png) | `#50d0d0` | Cyan |
| 8 | ![#e87830](https://via.placeholder.com/12/e87830/e87830.png) | `#e87830` | Orange |
| 9 | ![#7c3aed](https://via.placeholder.com/12/7c3aed/7c3aed.png) | `#7c3aed` | Violet |
| 10 | ![#e8508a](https://via.placeholder.com/12/e8508a/e8508a.png) | `#e8508a` | Rose |
| 11 | ![#34d399](https://via.placeholder.com/12/34d399/34d399.png) | `#34d399` | Mint |
| 12 | ![#38bdf8](https://via.placeholder.com/12/38bdf8/38bdf8.png) | `#38bdf8` | Sky |
| 13 | ![#8b8b8b](https://via.placeholder.com/12/8b8b8b/8b8b8b.png) | `#8b8b8b` | Gray |
| 14 | ![#505050](https://via.placeholder.com/12/505050/505050.png) | `#505050` | Slate |
| 15 | ![#a0724a](https://via.placeholder.com/12/a0724a/a0724a.png) | `#a0724a` | Tan |

---

## Performance Techniques

- **Blockhash caching** — refreshed every 15s from ER, avoids per-tx RPC call
- **Fire-and-forget txs** — `sendRawTransaction` with `skipPreflight`, no confirmation wait
- **Optimistic UI** — canvas updates instantly on click, before blockchain confirms
- **Duplicate suppression** — silently ignores "already been processed" errors
- **Zero-copy accounts** — efficient deserialization for the 4KB canvas
- **RequestAnimationFrame** — smooth flash animations without layout thrashing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust, Anchor 0.32, ephemeral-rollups-sdk 0.6 |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, CSS custom properties |
| Wallet | @solana/wallet-adapter (wallet-standard) |
| Network | Solana Devnet + MagicBlock Ephemeral Rollups |

---

## Built With

- [MagicBlock](https://www.magicblock.gg/) — Ephemeral Rollups for Solana
- [Anchor](https://www.anchor-lang.com/) — Solana program framework
- [Next.js](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS

---

## License

MIT
