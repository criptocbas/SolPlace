use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_accounts;

use crate::state::Canvas;

/// Commits the Canvas state from ER back to L1 without undelegating.
#[commit]
#[derive(Accounts)]
pub struct CommitCanvas<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub canvas: AccountLoader<'info, Canvas>,
}

pub fn handle_commit_canvas(ctx: Context<CommitCanvas>) -> Result<()> {
    commit_accounts(
        &ctx.accounts.payer,
        vec![&ctx.accounts.canvas.to_account_info()],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program,
    )?;

    Ok(())
}
