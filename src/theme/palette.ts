/**
 * Paleta del mockup de PISANTECH Workstation.
 *
 */
export const darkForestPalette = {
  name: "Dark forest",
  colors: {
    bg: "#050f17",
    bgDeep: "#030a10",
    panel: "#0a1923",
    panel2: "#0c1e29",
    panel3: "#102833",
    line: "#16313c",
    lineStrong: "#20404c",
    text: "#f2f8fa",
    muted: "#8aa4ae",
    muted2: "#627d87",
    brand: "#3fe4cd",
    brand2: "#21bfa9",
    warn: "#f0b86e",
    danger: "#f08a8a",
    focus: "#5da9e9",
    avatar: {
      neutralBg: "#15232d",
      neutralText: "#91a5b5",
      accentBg: "#14372f",
      accentText: "#35e3bc",
    },
    status: {
      available: "#3fe4cd",
      meeting: "#f0b86e",
      focusing: "#5da9e9",
      offline: "#627d87",
    },
  },
} as const;

export type DarkForestPalette = typeof darkForestPalette;

/**
 * Tema claro: marfil cálido, salvia y azul profundo del logo, con un turquesa
 * algo más profundo para conservar contraste sobre superficies claras.
 */
export const moonlightPalette = {
  name: "Moonlight",
  colors: {
    bg: "#f3f7f5",
    bgDeep: "#e9f1ee",
    panel: "#fcfefd",
    panel2: "#f6faf8",
    panel3: "#edf5f2",
    line: "#d6e3df",
    lineStrong: "#bfd2cc",
    text: "#102a33",
    muted: "#5e7775",
    muted2: "#7d9390",
    brand: "#1baa9c",
    brand2: "#33c4b3",
    warn: "#a16207",
    danger: "#be123c",
    focus: "#0369a1",
    avatar: {
      neutralBg: "#e1ece8",
      neutralText: "#46615f",
      accentBg: "#d8efea",
      accentText: "#0b726a",
    },
    status: {
      available: "#0f766e",
      meeting: "#a16207",
      focusing: "#0369a1",
      offline: "#5e7775",
    },
  },
} as const;

export const mockupCssVariables: Record<string, string> = {
  "--bg": darkForestPalette.colors.bg,
  "--bg-deep": darkForestPalette.colors.bgDeep,
  "--panel": darkForestPalette.colors.panel,
  "--panel-2": darkForestPalette.colors.panel2,
  "--panel-3": darkForestPalette.colors.panel3,
  "--line": darkForestPalette.colors.line,
  "--line-strong": darkForestPalette.colors.lineStrong,
  "--text": darkForestPalette.colors.text,
  "--muted": darkForestPalette.colors.muted,
  "--muted-2": darkForestPalette.colors.muted2,
  "--brand": darkForestPalette.colors.brand,
  "--brand-2": darkForestPalette.colors.brand2,
  "--warn": darkForestPalette.colors.warn,
  "--danger": darkForestPalette.colors.danger,
  "--focus": darkForestPalette.colors.focus,
  "--avatar-neutral-bg": darkForestPalette.colors.avatar.neutralBg,
  "--avatar-neutral-text": darkForestPalette.colors.avatar.neutralText,
  "--avatar-accent-bg": darkForestPalette.colors.avatar.accentBg,
  "--avatar-accent-text": darkForestPalette.colors.avatar.accentText,
  "--avatar-radius": "7px",
};
