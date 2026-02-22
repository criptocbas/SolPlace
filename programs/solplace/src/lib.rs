use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::ephemeral;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("CQCS2S6uj46VD2WEScxJLSWWNB8zYUppUHNS5GecMU8J");

#[ephemeral]
#[program]
pub mod solplace {
    use super::*;

    /// Initialize the canvas PDA on L1. Called once.
    pub fn initialize_canvas(ctx: Context<InitializeCanvas>) -> Result<()> {
        instructions::initialize_canvas::handle_initialize_canvas(ctx)
    }

    /// Place a pixel on the canvas. Hot path — runs on ER for sub-50ms.
    pub fn place_pixel(ctx: Context<PlacePixel>, x: u8, y: u8, color: u8) -> Result<()> {
        instructions::place_pixel::handle_place_pixel(ctx, x, y, color)
    }

    /// Delegate the canvas to the MagicBlock Ephemeral Rollup. Called on L1.
    pub fn delegate_canvas(ctx: Context<DelegateCanvas>) -> Result<()> {
        instructions::delegate_canvas::handle_delegate_canvas(ctx)
    }

    /// Commit canvas state from ER back to L1 without undelegating.
    pub fn commit_canvas(ctx: Context<CommitCanvas>) -> Result<()> {
        instructions::commit_canvas::handle_commit_canvas(ctx)
    }

    /// Commit canvas state and undelegate back to L1.
    pub fn undelegate_canvas(ctx: Context<UndelegateCanvas>) -> Result<()> {
        instructions::undelegate_canvas::handle_undelegate_canvas(ctx)
    }
}
