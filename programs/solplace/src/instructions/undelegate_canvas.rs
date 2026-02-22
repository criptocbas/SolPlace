use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::commit;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;

use crate::state::Canvas;

/// Commits the Canvas state and undelegates it back to L1.
#[commit]
#[derive(Accounts)]
pub struct UndelegateCanvas<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub canvas: AccountLoader<'info, Canvas>,
}

pub fn handle_undelegate_canvas(ctx: Context<UndelegateCanvas>) -> Result<()> {
    commit_and_undelegate_accounts(
        &ctx.accounts.payer,
        vec![&ctx.accounts.canvas.to_account_info()],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program,
    )?;

    Ok(())
}
