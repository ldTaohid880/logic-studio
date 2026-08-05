interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Converts a hex color string to its HSL representation.
 * Supports both short (#3bf) and long (#3b82f6) formats, with or without leading '#'.
 */
export function hexToHsl(hex: string): HSL {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Computes active, inactive, and pulse colors based on a base custom color.
 */
export function getWireColors(hexColor: string) {
  const { h, s, l } = hexToHsl(hexColor);
  
  // For LOW state: slightly dimmer/darker base appearance
  // In dark theme, we want it clearly inactive but visible (L: ~25-45)
  let lowL = Math.max(l * 0.6, 25);
  let lowS = s * 0.85;

  // For HIGH state: bright, saturated look
  let highL = Math.max(l, 55);
  let highS = Math.min(s + 10, 100);

  // For animated pulse: very light pastel version of the color
  let animL = Math.max(highL + 20, 80);
  let animS = Math.min(s + 10, 100);

  // Special boundaries for custom colors
  // Black / dark colors
  if (l < 10) {
    lowL = 30;
    highL = 70;
    animL = 90;
    lowS = 0;
    highS = 0;
    animS = 0;
  }
  // White / extremely light colors
  if (l > 90 && s < 10) {
    lowL = 45;
    highL = 95;
    animL = 100;
    lowS = 0;
    highS = 0;
    animS = 0;
  }

  return {
    low: `hsl(${h}, ${lowS}%, ${lowL}%)`,
    high: `hsl(${h}, ${highS}%, ${highL}%)`,
    anim: `hsl(${h}, ${animS}%, ${animL}%)`,
  };
}
