use anchor_lang::prelude::*;

use crate::state::Canvas;

pub const CANVAS_SEED: &[u8] = b"canvas";

#[derive(Accounts)]
pub struct InitializeCanvas<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Canvas::SIZE,
        seeds = [CANVAS_SEED],
        bump,
    )]
    pub canvas: AccountLoader<'info, Canvas>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_canvas(ctx: Context<InitializeCanvas>) -> Result<()> {
    let mut canvas = ctx.accounts.canvas.load_init()?;
    canvas.authority = ctx.accounts.authority.key();
    canvas.width = 64;
    canvas.height = 64;
    canvas.last_editor = ctx.accounts.authority.key();
    canvas.pixel_count = 0;
    // pixels are zero-initialized (color 0 = black)
    Ok(())
}
