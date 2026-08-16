/**
 * Blackflag palette — Adrift's dark nautical design language.
 * Tokens map to the scaffold's standard names so useColors() works unchanged.
 * Custom tokens (parchment, ink, brass, wax, seaglass) are added for letter views
 * and pirate-specific UI accents.
 */

const blackflag = {
  // Core surfaces
  background: '#0A1622',      // abyss — the deep ocean ground
  foreground: '#FFFFFF',      // foam — primary text

  // Cards / elevated panels
  card: '#16283A',            // tide
  cardForeground: '#FFFFFF',

  // Primary action (buttons, active states, titles)
  primary: '#FFC93C',         // brass
  primaryForeground: '#0A1622',

  // Secondary / raised surfaces
  secondary: '#24405A',       // tideLight
  secondaryForeground: '#FFFFFF',

  // Muted / subdued
  muted: '#1C3248',
  mutedForeground: '#A9C6DD', // foamDim

  // Accent / opened state
  accent: '#4FE0C0',          // seaglass
  accentForeground: '#0A1622',

  // Destructive / alerts
  destructive: '#FF6B4A',     // wax (signal red)
  destructiveForeground: '#FFFFFF',

  // Borders and inputs
  border: '#24405A',
  input: '#1C3248',

  // Legacy aliases
  text: '#FFFFFF',
  tint: '#FFC93C',

  // Domain-specific tokens
  parchment: '#FFF6E4',       // letter paper background
  paperEdge: '#F0E2C6',       // aged edge, for the paper gradient
  ink: '#14202C',             // letter text
  brass: '#FFC93C',           // explicit alias
  wax: '#FF6B4A',             // explicit alias
  seaglass: '#4FE0C0',        // explicit alias
};

const colors = {
  light: blackflag,
  dark: blackflag,
  radius: 10,
};

export default colors;
