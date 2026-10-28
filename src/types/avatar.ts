export const AVATAR_STYLES = [
  {
    id: "bottts",
    label: "Robot",
    description: "El estilo clásico de PISANTECH",
  },
  {
    id: "bottts-neutral",
    label: "Robot neutral",
    description: "Robots en tonos neutros",
  },
  {
    id: "adventurer",
    label: "Aventurero",
    description: "Ilustración con personalidad",
  },
  {
    id: "avataaars",
    label: "Persona",
    description: "Caricatura estilo oficina",
  },
  {
    id: "fun-emoji",
    label: "Emoji",
    description: "Expresivo y divertido",
  },
  {
    id: "micah",
    label: "Micah",
    description: "Retrato ilustrado moderno",
  },
  {
    id: "notionists",
    label: "Notionist",
    description: "Líneas limpias y minimalistas",
  },
  {
    id: "open-peeps",
    label: "Peeps",
    description: "Personas dibujadas a mano",
  },
  {
    id: "pixel-art",
    label: "Pixel",
    description: "Estética retro de 8 bits",
  },
  {
    id: "thumbs",
    label: "Thumbs",
    description: "Retratos suaves y redondos",
  },
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number]["id"];

export const DEFAULT_AVATAR_STYLE: AvatarStyle = "bottts";

export const AVATAR_BACKGROUNDS = [
  { label: "Transparente", value: null },
  { label: "Grafito", value: "0f172a" },
  { label: "Teal", value: "0d9488" },
  { label: "Azul", value: "1d4ed8" },
  { label: "Violeta", value: "7c3aed" },
  { label: "Rosa", value: "be123c" },
  { label: "Ámbar", value: "b45309" },
  { label: "Verde", value: "166534" },
] as const;

export interface AvatarConfig {
  style: AvatarStyle;
  seed: string;
  backgroundColor: string | null;
}

export function isAvatarStyle(value: string): value is AvatarStyle {
  return AVATAR_STYLES.some((style) => style.id === value);
}

/** Resuelve una configuración parcial y aplica los valores por defecto. */
export function resolveAvatar(
  avatar?: Partial<AvatarConfig> | null,
  fallbackSeed?: string,
): AvatarConfig {
  const style =
    avatar?.style && isAvatarStyle(avatar.style)
      ? avatar.style
      : DEFAULT_AVATAR_STYLE;
  const seed =
    avatar?.seed?.trim() || fallbackSeed?.trim() || "usuario";
  const backgroundColor =
    avatar?.backgroundColor?.replace(/^#/, "").toLowerCase() ?? null;

  return { style, seed, backgroundColor };
}

/** URL del SVG generado por DiceBear. */
export function avatarUrl(
  avatar?: Partial<AvatarConfig> | null,
  fallbackSeed?: string,
  size?: number,
): string {
  const resolved = resolveAvatar(avatar, fallbackSeed);
  const params = new URLSearchParams({ seed: resolved.seed });

  if (resolved.backgroundColor) {
    params.set("backgroundColor", resolved.backgroundColor);
  }
  if (size) {
    params.set("size", String(size));
  }

  return `https://api.dicebear.com/7.x/${resolved.style}/svg?${params.toString()}`;
}
