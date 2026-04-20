
/**
 * Utility to determine if a hex color is light or dark
 * @param hex Hex color string (e.g., '#FFFFFF' or '#000000')
 * @returns 'light' | 'dark'
 */
export const getContrastColor = (hex: string): 'light' | 'dark' => {
  if (!hex) return 'dark';
  
  // Remove hash if present
  const color = hex.startsWith('#') ? hex.slice(1) : hex;
  
  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? 'light' : 'dark';
};

/**
 * Returns the appropriate text color (white or black) based on background brightness
 * @param hex Background hex color
 * @returns 'text-white' | 'text-slate-900'
 */
export const getContrastTextColor = (hex: string): string => {
  return getContrastColor(hex) === 'light' ? 'text-slate-900' : 'text-white';
};
