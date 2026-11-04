export const STRENGTH_LEVELS = [
  {
    label: "Ingresa una contraseña",
    barClass: "bg-slate-700",
    textClass: "text-slate-500",
  },
  {
    label: "Debil",
    barClass: "bg-rose-500",
    textClass: "text-rose-400",
  },
  {
    label: "Regular",
    barClass: "bg-amber-500",
    textClass: "text-amber-400",
  },
  {
    label: "Buena",
    barClass: "bg-lime-500",
    textClass: "text-lime-400",
  },
  {
    label: "Contraseña fuerte",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-400",
  },
] as const;

export const STRENGTH_SEGMENTS = [1, 2, 3, 4] as const;

const PASSWORD_GROUPS = [
  "ABCDEFGHJKLMNPQRSTUVWXYZ",
  "abcdefghijkmnopqrstuvwxyz",
  "23456789",
  "!@#$%^&*",
];

const randomIndex = (max: number) => {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
};

const randomChar = (chars: string) => chars[randomIndex(chars.length)];

export const generateStrongPassword = () => {
  const allChars = PASSWORD_GROUPS.join("");
  const password = PASSWORD_GROUPS.map((group) => randomChar(group));

  while (password.length < 16) {
    password.push(randomChar(allChars));
  }

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [password[index], password[swapIndex]] = [
      password[swapIndex],
      password[index],
    ];
  }

  return password.join("");
};

export const getPasswordStrength = (password: string) => {
  if (!password) {
    return { score: 0, ...STRENGTH_LEVELS[0] };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const level = Math.max(1, Math.min(4, score));
  return { score: level, ...STRENGTH_LEVELS[level] };
};
