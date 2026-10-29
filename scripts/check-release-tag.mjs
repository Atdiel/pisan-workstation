#!/usr/bin/env node
import { readFileSync } from 'node:fs';

/**
 * Valida que el tag de release coincida con la versión del package.json.
 *
 * Uso:
 *   node scripts/check-release-tag.mjs v0.1.0
 *   GITHUB_REF_NAME=v0.1.0 node scripts/check-release-tag.mjs
 *
 * El CI de release lo ejecuta antes de empaquetar para evitar publicar un
 * instalador con una versión distinta a la etiqueta.
 */
const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME;

if (!tag) {
  console.error(
    '[release] Falta el tag. Pasa vX.Y.Z como argumento o define GITHUB_REF_NAME.',
  );
  process.exit(1);
}

if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
  console.error(`[release] Tag inválido "${tag}". Usa el formato vX.Y.Z.`);
  process.exit(1);
}

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const expectedTag = `v${pkg.version}`;

if (tag !== expectedTag) {
  console.error(
    `[release] El tag ${tag} no coincide con package.json (${expectedTag}).`,
  );
  process.exit(1);
}

console.log(
  `[release] ${tag} coincide con package.json (${pkg.version}).`,
);
