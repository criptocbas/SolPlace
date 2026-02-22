use anchor_lang::prelude::*;

use crate::errors::SolPlaceError;
use crate::state::Canvas;
use crate::instructions::initialize_canvas::CANVAS_SEED;

#[derive(Accounts)]
pub struct PlacePixel<'info> {
    pub painter: Signer<'info>,

    #[account(
        mut,
        seeds = [CANVAS_SEED],
        bump,
    )]
    pub canvas: AccountLoader<'info, Canvas>,
}

pub fn handle_place_pixel(ctx: Context<PlacePixel>, x: u8, y: u8, color: u8) -> Result<()> {
    require!(x < 64, SolPlaceError::XOutOfBounds);
    require!(y < 64, SolPlaceError::YOutOfBounds);
    require!(color < 16, SolPlaceError::InvalidColor);

    let mut canvas = ctx.accounts.canvas.load_mut()?;
    let index = (y as usize) * 64 + (x as usize);
    canvas.pixels[index] = color;
    canvas.last_editor = ctx.accounts.painter.key();
    canvas.pixel_count = canvas.pixel_count.saturating_add(1);

    Ok(())
}
