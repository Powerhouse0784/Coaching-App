/**
 * Design tokens for the Coaching-App design system.
 *
 * One deliberate palette instead of a different gradient per card.
 * `indigo` is the only brand/primary color. `gold` and `coral` are
 * accents with a specific job each — don't reach for them decoratively.
 */

export const colors = {
  // Neutrals
  ink: "#171923", // primary text, headings
  inkMuted: "#6B7280", // secondary text, captions
  inkFaint: "#9CA3AF", // placeholder / disabled text
  paper: "#F5F3EE", // app background (warm off-white, not stark white)
  surface: "#FFFFFF", // card / sheet surface
  surfaceMuted: "#EFEDE6", // subtle fill (chips, input backgrounds)
  border: "#E6E2D8", // hairline dividers and card borders

  // Brand — the ONE primary color. Buttons, active tabs, links, focus rings.
  indigo: "#263C7A",
  indigoDark: "#1B2C5C",
  indigoTint: "#E7EAF4", // light wash for selected states / soft backgrounds

  // Accents — used sparingly, each with one job
  gold: "#C99A2E", // achievement: streaks, ratings, "top rated" tags
  goldTint: "#FBF2DF",
  coral: "#C1443A", // urgent/destructive only: errors, unread doubts, delete
  coralTint: "#FBEAE8",
  mint: "#2F8F5B", // success/confirmation only: paid, submitted, completed
  mintTint: "#E7F4ED",

  // Fixed (don't invert in dark mode)
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const dark = {
  ink: "#F1F0EC",
  inkMuted: "#A2A6B4",
  inkFaint: "#6B7280",
  paper: "#101218",
  surface: "#181B24",
  surfaceMuted: "#20232D",
  border: "#2A2E3A",
  indigo: "#5A72C4",
  indigoDark: "#3A4E9B",
  indigoTint: "#1E2740",
  gold: "#E0B750",
  goldTint: "#2E2716",
  coral: "#E17B72",
  coralTint: "#331F1D",
  mint: "#5FBD8C",
  mintTint: "#17281F",
} as const;

export const radius = {
  sm: 10, // chips, small buttons
  md: 12, // inputs, buttons
  lg: 16, // cards
  xl: 22, // sheets, modals
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

// Space Grotesk = headlines, stats, scores (report/scorecard feel).
// Inter = body copy and UI chrome. Load both via expo-google-fonts.
export const fonts = {
  display: "SpaceGrotesk_600SemiBold",
  displayBold: "SpaceGrotesk_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
} as const;

export const type = {
  h1: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36 },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  h3: { fontFamily: fonts.display, fontSize: 19, lineHeight: 25 },
  stat: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 38 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.bodySemibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
} as const;

// Hairline-first: one soft shadow reserved for floating/elevated things
// (modals, FABs). Cards use a border, not a shadow, by default.
export const shadow = {
  none: {},
  raised: {
    shadowColor: "#171923",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export type ThemeColors = typeof colors;
