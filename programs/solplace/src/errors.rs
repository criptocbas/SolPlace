use anchor_lang::prelude::*;

#[error_code]
pub enum SolPlaceError {
    #[msg("X coordinate out of bounds (must be 0-63)")]
    XOutOfBounds,
    #[msg("Y coordinate out of bounds (must be 0-63)")]
    YOutOfBounds,
    #[msg("Invalid color index (must be 0-15)")]
    InvalidColor,
}
