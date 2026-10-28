#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mantiene sincronizada la versión de suite entre el backend y el escritorio.
 *
 * Uso:
 *   node scripts/suite-version.mjs check
 *   node scripts/suite-version.mjs set 0.2.0
 *
 * Los repositorios se buscan como hermanos del repo actual. Si el checkout
 * tiene otra estructura, define PISAN_BACKEND_DIR y PISAN_FRONTEND_DIR.
 */
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const backendDir = path.resolve(
  process.env.PISAN_BACKEND_DIR ??
    path.join(repoRoot, '..', 'pisan-backend'),
);
const frontendDir = path.resolve(
  process.env.PISAN_FRONTEND_DIR ??
    path.join(repoRoot, '..', 'pisan-workstation'),
);

const repos = [
  { label: 'backend', dir: backendDir, packageName: 'pisan-backend' },
  { label: 'desktop', dir: frontendDir, packageName: 'pisan-workstation' },
];

const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function fail(message) {
  console.error(`[version] ${message}`);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function readRepo(repo) {
  const packagePath = path.join(repo.dir, 'package.json');
  if (!existsSync(packagePath)) {
    fail(
      `No existe ${packagePath}. Define PISAN_BACKEND_DIR y PISAN_FRONTEND_DIR si los repos no están uno al lado del otro.`,
    );
  }

  const pkg = readJson(packagePath);
  if (pkg.name !== repo.packageName) {
    fail(`${packagePath} no pertenece a ${repo.packageName}.`);
  }
  if (typeof pkg.version !== 'string' || !semver.test(pkg.version)) {
    fail(`${packagePath} no tiene una versión SemVer válida: ${pkg.version}`);
  }

  const lockPath = path.join(repo.dir, 'package-lock.json');
  if (existsSync(lockPath)) {
    const lock = readJson(lockPath);
    const lockVersion = lock.version ?? lock.packages?.['']?.version;
    if (lockVersion && lockVersion !== pkg.version) {
      fail(
        `${lockPath} está en ${lockVersion} pero package.json está en ${pkg.version}. Ejecuta npm install antes de versionar.`,
      );
    }
  }

  return { ...repo, version: pkg.version };
}

function check() {
  const current = repos.map(readRepo);
  for (const repo of current) {
    console.log(`[version] ${repo.label}: ${repo.packageName}@${repo.version}`);
  }

  const versions = new Set(current.map((repo) => repo.version));
  if (versions.size !== 1) {
    fail(
      `Las versiones no coinciden. Ejecuta: npm run release:set -- <version>`,
    );
  }

  console.log(`[version] Suite v${current[0].version} sincronizada.`);
}

function setVersion(version) {
  if (!semver.test(version)) {
    fail(`Versión inválida "${version}". Usa SemVer, por ejemplo 0.1.0.`);
  }

  // Valida ambos repos antes de escribir para no dejar una actualización a medias.
  for (const repo of repos) readRepo(repo);

  for (const repo of repos) {
    console.log(`[version] Actualizando ${repo.label} a ${version}...`);
    const args = [
      'version',
      version,
      '--no-git-tag-version',
      '--allow-same-version',
    ];

    if (process.platform === 'win32') {
      // npm es un .cmd y Node no puede ejecutarlo directamente en Windows.
      // La versión ya fue validada con la expresión SemVer de arriba.
      execFileSync(
        process.env.ComSpec ?? 'cmd.exe',
        ['/d', '/s', '/c', `npm ${args.join(' ')}`],
        { cwd: repo.dir, stdio: 'inherit' },
      );
    } else {
      execFileSync('npm', args, {
        cwd: repo.dir,
        stdio: 'inherit',
      });
    }
  }

  check();
  console.log(
    `\n[version] Siguiente paso: actualiza ambos CHANGELOG.md, haz commit y crea el tag v${version} en cada repositorio.`,
  );
}

const [command = 'check', version] = process.argv.slice(2);

if (command === 'check') {
  check();
} else if (command === 'set') {
  if (!version) fail('Uso: node scripts/suite-version.mjs set <version>');
  setVersion(version);
} else {
  fail(`Comando no reconocido: ${command}. Usa "check" o "set <version>".`);
}
