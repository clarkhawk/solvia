/**
 * @file check-env.ts
 * @description Diagnostic des chaînes de connexion de .env.local, sans jamais
 * afficher de mot de passe : seulement l'utilisateur, l'hôte, le port, la base,
 * les paramètres, et la nature des caractères du mot de passe.
 *
 * Usage : npx tsx scripts/check-env.ts
 */

import fs from "fs";
import path from "path";

const FILE = process.argv[2] ?? ".env.local";

function readLines(file: string): string[] {
  let raw = fs.readFileSync(file);
  if (raw[0] === 0xff && raw[1] === 0xfe) raw = Buffer.from(raw.toString("utf16le"), "utf8");
  return raw.toString("utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n");
}

function unquote(value: string): string {
  let v = value.trim();
  while (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/^["']+/, "").replace(/["']+$/, "");
}

const PRISMA_OK = new Set([
  "pgbouncer",
  "connection_limit",
  "connect_timeout",
  "pool_timeout",
  "sslmode",
  "sslcert",
  "schema",
  "socket_timeout",
  "statement_cache_size",
  "application_name",
]);

function inspect(name: string, value: string) {
  console.log(`\n=== ${name}`);
  console.log(`longueur totale : ${value.length}`);

  const scheme = value.slice(0, value.indexOf("://") + 3);
  console.log(`protocole       : ${scheme || "(absent)"}`);
  if (scheme !== "postgresql://" && scheme !== "postgres://") {
    console.log("  ⚠ doit être postgresql:// ou postgres://");
  }

  const at = value.lastIndexOf("@");
  if (at === -1) {
    console.log("  ⚠ aucun @ : la chaîne ne contient pas d'identifiants");
    return;
  }

  const creds = value.slice(value.indexOf("://") + 3, at);
  const colon = creds.indexOf(":");
  const user = colon === -1 ? creds : creds.slice(0, colon);
  const password = colon === -1 ? "" : creds.slice(colon + 1);
  const rest = value.slice(at + 1);

  console.log(`utilisateur     : ${user}`);
  const specials = [...new Set(password.replace(/[A-Za-z0-9]/g, ""))];
  console.log(
    `mot de passe    : ${password.length} caractères, ` +
      (specials.length ? `caractères spéciaux : ${specials.join(" ")}` : "lettres et chiffres uniquement"),
  );
  const risky = specials.filter((c) => "@:/?#[]%& ".includes(c));
  if (risky.length) {
    console.log(`  ⚠ à encoder dans l'URL : ${risky.join(" ")}  (@ → %40, # → %23, / → %2F, % → %25, ? → %3F, & → %26)`);
  }

  const [hostPart, queryPart] = rest.split("?");
  console.log(`hôte / base     : ${hostPart}`);

  if (queryPart) {
    console.log("paramètres :");
    for (const pair of queryPart.split("&")) {
      const key = pair.split("=")[0];
      const ok = PRISMA_OK.has(key);
      console.log(`  ${pair}${ok ? "" : "   ⚠ paramètre non reconnu par Prisma : à supprimer"}`);
    }
  } else {
    console.log("paramètres      : (aucun)");
  }
}

const file = path.resolve(process.cwd(), FILE);
if (!fs.existsSync(file)) {
  console.error(`Fichier introuvable : ${file}`);
  process.exit(1);
}

console.log(`Fichier : ${file}`);

// --- Contrôle de forme de toutes les lignes : guillemets doublés, espaces parasites.
console.log("\n=== Contrôle de forme (aucune valeur affichée)");
let problems = 0;
for (const line of readLines(file)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;

  const name = trimmed.slice(0, eq).trim();
  const rawValue = trimmed.slice(eq + 1);
  const value = rawValue.trim();
  const notes: string[] = [];

  if (/^["']{2}/.test(value) || /["']{2}$/.test(value)) notes.push("guillemets doublés");
  else if ((value.startsWith('"') && !value.endsWith('"')) || (value.startsWith("'") && !value.endsWith("'"))) {
    notes.push("guillemet ouvert non fermé");
  }
  if (/\s$/.test(rawValue) && !value.endsWith('"')) notes.push("espace en fin de ligne");
  if (name !== trimmed.slice(0, eq)) notes.push("espace autour du nom");
  if (value.length === 0) notes.push("valeur vide");

  if (notes.length > 0) {
    problems++;
    console.log(`  ⚠ ${name} : ${notes.join(", ")}`);
  }
}
console.log(problems === 0 ? "  Aucune anomalie de forme." : `  ${problems} ligne(s) à corriger : une seule paire de guillemets, ou aucune.`);

for (const line of readLines(file)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const name = trimmed.slice(0, eq).trim();
  if (name !== "DATABASE_URL" && name !== "DIRECT_URL") continue;
  inspect(name, unquote(trimmed.slice(eq + 1)));
}

console.log("\nAucun mot de passe n'a été affiché.");
