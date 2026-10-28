import { useEffect, useState } from "react";
import type { AvatarConfig } from "../../types/avatar";
import { resolveAvatar, avatarUrl } from "../../types/avatar";

interface Props {
  name: string;
  avatar?: AvatarConfig | null;
  className?: string;
  showBorder?: boolean;
  loading?: "eager" | "lazy";
  title?: string;
}

const initialsFor = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

/**
 * Avatar reutilizable. Usa la configuración guardada o el estilo por defecto
 * (bottts con el nombre como semilla) y cae a iniciales si la imagen falla.
 */
export default function UserAvatar({
  name,
  avatar,
  className = "h-8 w-8",
  showBorder = true,
  loading = "eager",
  title,
}: Props) {
  const src = avatarUrl(resolveAvatar(avatar, name), name);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const border = showBorder ? "border border-brand-teal/40" : "";
  const base = `shrink-0 rounded-full bg-brand-navy object-cover ${border}`;

  if (failed) {
    return (
      <div
        className={`${base} flex items-center justify-center text-[0.7em] font-bold text-brand-teal ${className}`}
        title={title ?? name}
        aria-label={`Avatar de ${name}`}
      >
        {initialsFor(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Avatar de ${name}`}
      title={title ?? name}
      loading={loading}
      onError={() => setFailed(true)}
      className={`${base} ${className}`}
    />
  );
}
