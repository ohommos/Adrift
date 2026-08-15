// Ported from the "Original Glass & Ink" prototype's THEMES map. Only Deep
// Water ships in the UI for now, but the shape stays pluggable so the other
// three moods (Foxed / Nocturne / Salt & Rust) are a one-line swap later.

export interface ThemeColors {
  abyss: string; // ground
  tide: string; // panels
  tideLight: string; // raised / borders
  seaglass: string; // "opened" state
  brass: string; // primary accent
  wax: string; // signal red / alerts
  parchment: string; // letter paper
  paperEdge: string;
  ink: string; // letter text
  foam: string; // primary text
  foamDim: string; // secondary text
}

export interface Theme {
  key: string;
  name: string;
  c: ThemeColors;
  room: string;
  display: string; // screen titles
  letter: string; // message body text only
  meta: string; // short uppercase labels / counts
}

const deepwater: Theme = {
  key: "deepwater",
  name: "Deep Water",
  c: {
    abyss: "#0D231E",
    tide: "#15332C",
    tideLight: "#1F4A40",
    seaglass: "#8FBFAE",
    brass: "#C97F3E",
    wax: "#8E3A2E",
    parchment: "#EDE3CE",
    paperEdge: "#DCCFB2",
    ink: "#2A2622",
    foam: "#F2EFE6",
    foamDim: "#9DB5AC",
  },
  room: "#071612",
  display: "BodoniModa_500Medium",
  letter: "EBGaramond_400Regular",
  meta: "JetBrainsMono_500Medium",
};

export const THEMES: Record<string, Theme> = { deepwater };
export const ACTIVE_THEME_KEY: keyof typeof THEMES = "deepwater";
export const theme = THEMES[ACTIVE_THEME_KEY];
export const C = theme.c;
