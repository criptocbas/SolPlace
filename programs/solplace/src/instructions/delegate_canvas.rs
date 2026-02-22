use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;

use crate::instructions::initialize_canvas::CANVAS_SEED;

/// Delegates the Canvas PDA to the MagicBlock Ephemeral Rollup.
/// Called on L1 after initialize_canvas. After delegation, place_pixel
/// instructions are sent to the ER endpoint for sub-50ms processing.
#[delegate]
#[derive(Accounts)]
pub struct DelegateCanvas<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: The Canvas PDA to delegate. Validated by seeds.
    #[account(
        mut,
        del,
        seeds = [CANVAS_SEED],
        bump,
    )]
    pub canvas: AccountInfo<'info>,
}

pub fn handle_delegate_canvas(ctx: Context<DelegateCanvas>) -> Result<()> {
    ctx.accounts.delegate_canvas(
        &ctx.accounts.authority,
        &[CANVAS_SEED],
        DelegateConfig::default(),
    )?;

    Ok(())
}
