/**
 * @file seed-demo.ts
 * @description Charge le jeu de démonstration (clients, factures, paiements, relances)
 * depuis un classeur Excel à quatre feuilles vers la base de l'organisation choisie.
 *
 * Le script est idempotent : relancé deux fois, il ne crée pas de doublon.
 * Il ne supprime jamais rien.
 *
 * Usage :
 *   npm run db:seed:demo -- --file data/03_Impayes.xlsx
 *   npm run db:seed:demo -- --file data/03_Impayes.xlsx --org <organizationId>
 *   npm run db:seed:demo -- --file data/03_Impayes.xlsx --email admin@exemple.tg
 *   npm run db:seed:demo -- --file data/03_Impayes.xlsx --dry-run
 *
 * Feuilles attendues :
 *   clients   : client_id, client, secteur, type_client, anciennete_mois, retards_precedents, email
 *   factures  : facture_id, client_id, date_emission, date_echeance, montant_fcfa, date_paiement, statut
 *   paiements : paiement_id, facture_id, date_paiement, montant_fcfa, mode
 *   relances  : relance_id, facture_id, date, canal, niveau, resultat
 */

import fs from "fs";
import path from "path";
import { PrismaClient, RelanceChannel, RelanceLevel, RelanceResult } from "@prisma/client";
import type { InvoiceStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import { encryptPii, hashEmail } from "../src/shared/crypto/encryption";

/**
 * Charge un fichier d'environnement sans dépendre d'un drapeau de ligne de commande
 * (`node --env-file` n'est pas portable entre Windows et Unix) ni du lecteur intégré
 * de Node, qui rejette les fichiers enregistrés par le Bloc-notes (marque d'ordre des
 * octets, encodage UTF-16, retours chariot Windows).
 */
function loadEnvFile(file: string): string[] {
  let raw = fs.readFileSync(file);

  // UTF-16 LE : un octet nul un caractère sur deux dès le début du fichier.
  if (raw[0] === 0xff && raw[1] === 0xfe) raw = Buffer.from(raw.toString("utf16le"), "utf8");

  let text = raw.toString("utf8").replace(/^﻿/, "");
  text = text.replace(/\r\n/g, "\n");

  const loaded: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const name = trimmed.slice(0, eq).replace(/^export\s+/, "").trim();
    let value = trimmed.slice(eq + 1).trim();

    // Guillemets en trop (copier-coller doublé) : on les retire tous.
    while (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1).trim();
    }
    value = value.replace(/^["']+/, "").replace(/["']+$/, "");

    if (!name) continue;
    if (process.env[name] === undefined) process.env[name] = value;
    loaded.push(name);
  }
  return loaded;
}

if (!process.env.DATABASE_URL || !process.env.ENCRYPTION_KEY) {
  for (const candidate of [".env.local", ".env"]) {
    const file = path.resolve(process.cwd(), candidate);
    if (!fs.existsSync(file)) continue;

    const names = loadEnvFile(file);
    console.log(`Variables chargées depuis ${candidate} : ${names.join(", ") || "(aucune)"}`);
    if (process.env.DATABASE_URL) break;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL introuvable. Vérifier que .env.local existe à la racine et contient une ligne DATABASE_URL=...",
  );
}
if (!process.env.ENCRYPTION_KEY) {
  throw new Error(
    "ENCRYPTION_KEY introuvable. Vérifier que .env.local contient une ligne ENCRYPTION_KEY=...",
  );
}

// --direct : passer par DIRECT_URL (port 5432). Utile quand le port 6543 du pooler
// de transaction est bloqué par le réseau local, ce qui arrive souvent.
const USE_DIRECT = process.argv.includes("--direct");
const DATABASE_URL = USE_DIRECT ? process.env.DIRECT_URL : process.env.DATABASE_URL;

if (USE_DIRECT && !process.env.DIRECT_URL) {
  throw new Error("--direct demandé mais DIRECT_URL est absente de .env.local.");
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

// ---------------------------------------------------------------- arguments

function arg(name: string): string | undefined {
  const prefixed = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (prefixed) return prefixed.split("=").slice(1).join("=");
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const FILE = arg("file") ?? "data/03_Impayes.xlsx";
const ORG_ID = arg("org");
const USER_EMAIL = arg("email");
const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------- lecture

interface ClientRow {
  client_id: string;
  client: string;
  email?: string;
}
interface InvoiceRow {
  facture_id: string;
  client_id: string;
  date_emission: string;
  date_echeance: string;
  montant_fcfa: number;
}
interface PaymentRow {
  paiement_id: string;
  facture_id: string;
  date_paiement: string;
  montant_fcfa: number;
  mode?: string;
}
interface RelanceRow {
  relance_id: string;
  facture_id: string;
  date: string;
  canal: string;
  niveau: string;
  resultat: string;
}

function sheet<T>(workbook: XLSX.WorkBook, name: string): T[] {
  const ws = workbook.Sheets[name];
  if (!ws) throw new Error(`Feuille « ${name} » absente du classeur.`);
  return XLSX.utils.sheet_to_json<T>(ws, { defval: null, raw: true });
}

/** Date à midi UTC : aucune bascule de fuseau ne peut décaler le jour. */
function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
  }
  const text = String(value ?? "").trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3], 12));
  const eu = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (eu) return new Date(Date.UTC(+eu[3], +eu[2] - 1, +eu[1], 12));
  throw new Error(`Date illisible : « ${text} »`);
}

// ---------------------------------------------------------------- mappages

const CHANNELS: Record<string, RelanceChannel> = {
  email: RelanceChannel.email,
  "e-mail": RelanceChannel.email,
  mail: RelanceChannel.email,
  whatsapp: RelanceChannel.whatsapp,
  telephone: RelanceChannel.phone,
  tel: RelanceChannel.phone,
  appel: RelanceChannel.phone,
};

const LEVELS: Record<string, RelanceLevel> = {
  "rappel amical": RelanceLevel.friendly,
  "relance amicale": RelanceLevel.friendly,
  "relance 1": RelanceLevel.reminder_1,
  "rappel 1": RelanceLevel.reminder_1,
  "relance 2": RelanceLevel.reminder_2,
  "rappel 2": RelanceLevel.reminder_2,
  "dernier rappel": RelanceLevel.final_notice,
  "mise en demeure": RelanceLevel.final_notice,
};

const RESULTS: Record<string, RelanceResult> = {
  "reponse recue": RelanceResult.response_received,
  "promesse de paiement": RelanceResult.payment_promise,
  "a relancer": RelanceResult.to_follow_up,
  "a suivre": RelanceResult.to_follow_up,
  "paiement recu": RelanceResult.payment_received,
  "sans reponse": RelanceResult.no_response,
  "aucune reponse": RelanceResult.no_response,
};

/** Minuscules sans accents : les libellés du fichier varient, les clés non. */
function key(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function computeStatus(amount: number, amountPaid: number, dueAt: Date): InvoiceStatus {
  if (amountPaid >= amount) return "paid";
  if (amountPaid > 0) return "partially_paid";
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dueUtc = Date.UTC(dueAt.getUTCFullYear(), dueAt.getUTCMonth(), dueAt.getUTCDate());
  return dueUtc < todayUtc ? "overdue" : "upcoming";
}

// ---------------------------------------------------------------- exécution

async function resolveOrganization(): Promise<{ organizationId: string; userId: string }> {
  if (USER_EMAIL) {
    const user = await prisma.user.findFirst({ where: { email: USER_EMAIL } });
    if (!user) throw new Error(`Aucun utilisateur avec l'e-mail ${USER_EMAIL}.`);
    return { organizationId: user.organizationId, userId: user.id };
  }

  const organizationId =
    ORG_ID ??
    (await (async () => {
      const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
      if (orgs.length === 1) return orgs[0].id;
      throw new Error(
        `Préciser --org ou --email. Organisations disponibles :\n` +
          orgs.map((o) => `  ${o.id}  ${o.name}`).join("\n"),
      );
    })());

  const user = await prisma.user.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
  if (!user) throw new Error(`Aucun utilisateur dans l'organisation ${organizationId}.`);
  return { organizationId, userId: user.id };
}

async function main() {
  const filePath = path.resolve(process.cwd(), FILE);
  const workbook = XLSX.readFile(filePath);

  const clients = sheet<ClientRow>(workbook, "clients");
  const invoices = sheet<InvoiceRow>(workbook, "factures");
  const payments = sheet<PaymentRow>(workbook, "paiements");
  const relances = sheet<RelanceRow>(workbook, "relances");

  const { organizationId, userId } = await resolveOrganization();

  console.log(`Fichier      : ${filePath}`);
  console.log(`Organisation : ${organizationId}`);
  console.log(
    `Contenu      : ${clients.length} clients, ${invoices.length} factures, ${payments.length} paiements, ${relances.length} relances`,
  );
  if (DRY_RUN) console.log("Mode simulation : aucune écriture.\n");

  const report = {
    clientsCreated: 0,
    clientsExisting: 0,
    invoicesCreated: 0,
    invoicesExisting: 0,
    paymentsCreated: 0,
    paymentsExisting: 0,
    relancesCreated: 0,
    relancesExisting: 0,
    capped: 0,
    skipped: [] as string[],
  };

  // -- clients ------------------------------------------------------------
  const clientIdByCode = new Map<string, string>();

  for (const row of clients) {
    const externalCode = String(row.client_id).trim();
    const name = String(row.client ?? "").trim();
    const email = row.email ? String(row.email).trim() : undefined;
    if (!externalCode || !name) {
      report.skipped.push(`client ${externalCode || "(sans code)"} : nom manquant`);
      continue;
    }

    const existing = await prisma.client.findUnique({
      where: { organizationId_externalCode: { organizationId, externalCode } },
      select: { id: true },
    });

    if (existing) {
      clientIdByCode.set(externalCode, existing.id);
      report.clientsExisting++;
      continue;
    }

    if (DRY_RUN) {
      clientIdByCode.set(externalCode, "dry-run");
      report.clientsCreated++;
      continue;
    }

    const created = await prisma.client.create({
      data: {
        organizationId,
        externalCode,
        identityEncrypted: encryptPii(JSON.stringify({ name })),
        contactEncrypted: encryptPii(JSON.stringify({ email, phone: undefined })),
        emailHash: email ? hashEmail(email) : null,
      },
      select: { id: true },
    });
    clientIdByCode.set(externalCode, created.id);
    report.clientsCreated++;
  }

  // -- factures -----------------------------------------------------------
  const invoiceByReference = new Map<string, { id: string; amount: number; dueAt: Date }>();

  for (const row of invoices) {
    const reference = String(row.facture_id).trim();
    const clientCode = String(row.client_id).trim();
    const clientId = clientIdByCode.get(clientCode);

    if (!clientId) {
      report.skipped.push(`facture ${reference} : client ${clientCode} introuvable`);
      continue;
    }

    const amount = Number(row.montant_fcfa);
    const issuedAt = toDate(row.date_emission);
    const dueAt = toDate(row.date_echeance);

    const existing = await prisma.invoice.findUnique({
      where: { organizationId_reference: { organizationId, reference } },
      select: { id: true, amount: true, dueAt: true },
    });

    if (existing) {
      invoiceByReference.set(reference, {
        id: existing.id,
        amount: Number(existing.amount),
        dueAt: existing.dueAt,
      });
      report.invoicesExisting++;
      continue;
    }

    if (DRY_RUN) {
      invoiceByReference.set(reference, { id: "dry-run", amount, dueAt });
      report.invoicesCreated++;
      continue;
    }

    const created = await prisma.invoice.create({
      data: {
        organizationId,
        clientId,
        reference,
        amount,
        amountPaid: 0,
        issuedAt,
        dueAt,
        status: computeStatus(amount, 0, dueAt),
      },
      select: { id: true },
    });
    invoiceByReference.set(reference, { id: created.id, amount, dueAt });
    report.invoicesCreated++;
  }

  // -- paiements ----------------------------------------------------------
  // Chaque paiement est rattaché à SA facture (le fichier le précise), et le
  // montant imputé est plafonné au reste dû : la base ne peut pas dépasser 100 %.
  const paidByInvoice = new Map<string, number>();

  for (const row of payments) {
    const reference = String(row.paiement_id).trim();
    const invoiceRef = String(row.facture_id).trim();
    const invoice = invoiceByReference.get(invoiceRef);

    if (!invoice) {
      report.skipped.push(`paiement ${reference} : facture ${invoiceRef} introuvable`);
      continue;
    }

    const existing = DRY_RUN
      ? null
      : await prisma.payment.findFirst({
          where: { organizationId, reference: { startsWith: reference } },
          select: { id: true },
        });

    if (existing) {
      report.paymentsExisting++;
      continue;
    }

    const alreadyPaid = paidByInvoice.get(invoiceRef) ?? 0;
    const remaining = Math.max(0, invoice.amount - alreadyPaid);
    const requested = Number(row.montant_fcfa);
    const allocated = Math.min(requested, remaining);

    if (allocated < requested) report.capped++;
    if (allocated <= 0) {
      report.skipped.push(`paiement ${reference} : facture ${invoiceRef} déjà soldée`);
      continue;
    }

    paidByInvoice.set(invoiceRef, alreadyPaid + allocated);
    if (DRY_RUN) {
      report.paymentsCreated++;
      continue;
    }

    const dbInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      select: { clientId: true },
    });

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          organizationId,
          clientId: dbInvoice!.clientId,
          amount: requested,
          paidAt: toDate(row.date_paiement),
          reference: row.mode ? `${reference} · ${row.mode}` : reference,
        },
        select: { id: true },
      });

      await tx.paymentAllocation.create({
        data: { paymentId: payment.id, invoiceId: invoice.id, amount: allocated },
      });

      const newAmountPaid = alreadyPaid + allocated;
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          status: computeStatus(invoice.amount, newAmountPaid, invoice.dueAt),
        },
      });
    });

    report.paymentsCreated++;
  }

  // -- relances -----------------------------------------------------------
  for (const row of relances) {
    const invoiceRef = String(row.facture_id).trim();
    const invoice = invoiceByReference.get(invoiceRef);

    if (!invoice) {
      report.skipped.push(`relance ${row.relance_id} : facture ${invoiceRef} introuvable`);
      continue;
    }

    const channel = CHANNELS[key(String(row.canal))];
    const level = LEVELS[key(String(row.niveau))];
    const result = RESULTS[key(String(row.resultat))];

    if (!channel || !level || !result) {
      report.skipped.push(
        `relance ${row.relance_id} : valeur inconnue (canal « ${row.canal} », niveau « ${row.niveau} », résultat « ${row.resultat} »)`,
      );
      continue;
    }

    const sentAt = toDate(row.date);

    const existing = DRY_RUN
      ? null
      : await prisma.relance.findFirst({
          where: { organizationId, invoiceId: invoice.id, channel, level, sentAt },
          select: { id: true },
        });

    if (existing) {
      report.relancesExisting++;
      continue;
    }

    if (!DRY_RUN) {
      await prisma.relance.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          createdById: userId,
          channel,
          level,
          result,
          sentAt,
        },
      });
    }
    report.relancesCreated++;
  }

  // -- rapport ------------------------------------------------------------
  console.log("\nRésultat");
  console.log(`  clients   : ${report.clientsCreated} créés, ${report.clientsExisting} déjà présents`);
  console.log(`  factures  : ${report.invoicesCreated} créées, ${report.invoicesExisting} déjà présentes`);
  console.log(`  paiements : ${report.paymentsCreated} créés, ${report.paymentsExisting} déjà présents`);
  console.log(`  relances  : ${report.relancesCreated} créées, ${report.relancesExisting} déjà présentes`);
  if (report.capped > 0) {
    console.log(`  ${report.capped} paiement(s) plafonné(s) au reste dû (le fichier dépassait le montant de la facture).`);
  }
  if (report.skipped.length > 0) {
    console.log(`  ${report.skipped.length} ligne(s) ignorée(s) :`);
    for (const line of report.skipped.slice(0, 20)) console.log(`    - ${line}`);
    if (report.skipped.length > 20) console.log(`    … et ${report.skipped.length - 20} autres.`);
  }
}

main()
  .catch((error) => {
    console.error("\nÉchec du chargement :", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
