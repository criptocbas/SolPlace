use anchor_lang::prelude::*;

/// 64x64 pixel canvas. Each pixel is a single byte (color index 0-15).
/// Total pixels: 4096, stored as a flat array.
///
/// Pixel at (x, y) is stored at index y * 64 + x.
///
/// Uses zero_copy to avoid SBF stack overflow (4096 byte limit).
#[account(zero_copy)]
#[repr(C)]
pub struct Canvas {
    /// Authority who initialized the canvas
    pub authority: Pubkey,
    /// Canvas width (always 64)
    pub width: u8,
    /// Canvas height (always 64)
    pub height: u8,
    /// Padding for alignment
    pub _padding: [u8; 6],
    /// Last editor's pubkey
    pub last_editor: Pubkey,
    /// Total number of pixel placements
    pub pixel_count: u64,
    /// Pixel data: 64x64 = 4096 bytes, each byte is a color index (0-15)
    pub pixels: [u8; 4096],
}

impl Canvas {
    /// 8 (discriminator) + 32 (authority) + 1 (width) + 1 (height) + 6 (padding) + 32 (last_editor) + 8 (pixel_count) + 4096 (pixels)
    pub const SIZE: usize = 8 + 32 + 1 + 1 + 6 + 32 + 8 + 4096;
}
