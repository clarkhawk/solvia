import { describe, expect, it } from "vitest";
import { importParserService, parseAmount, parseImportDate } from "../parser.service";

describe("parseAmount", () => {
  it("lit les formats courants", () => {
    expect(parseAmount("4500.00")).toBe(4500);
    expect(parseAmount("1 250,50")).toBe(1250.5);
    expect(parseAmount("1 250,50")).toBe(1250.5);
    expect(parseAmount("1.250,50")).toBe(1250.5);
    expect(parseAmount("1,250.50")).toBe(1250.5);
    expect(parseAmount("3 200,00 €")).toBe(3200);
    expect(parseAmount(1850.5)).toBe(1850.5);
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("")).toBeNull();
  });
});

describe("parseImportDate", () => {
  const iso = (d: Date | null) => d?.toISOString().slice(0, 10);
  it("lit ISO, français et série Excel", () => {
    expect(iso(parseImportDate("2026-03-15"))).toBe("2026-03-15");
    expect(iso(parseImportDate("15/03/2026"))).toBe("2026-03-15");
    expect(iso(parseImportDate("15.03.2026"))).toBe("2026-03-15");
    expect(iso(parseImportDate(new Date(Date.UTC(2026, 2, 15))))).toBe("2026-03-15");
    expect(iso(parseImportDate(46096))).toBe("2026-03-15");
    expect(parseImportDate("31/02/2026")).toBeNull();
    expect(parseImportDate("pas une date")).toBeNull();
  });
});

describe("parseCSV", () => {
  it("accepte le modèle officiel", () => {
    const csv = [
      "client_name,client_email,client_phone,external_code,invoice_reference,invoice_amount,invoice_issued_at,invoice_due_at",
      '"Acme SAS","f@acme.fr","+228900","CLI-001","FAC-001","4500.00","2026-03-01","2026-03-31"',
    ].join("\n");
    const r = importParserService.parseCSV(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].invoiceAmount).toBe(4500);
    expect(r.rows[0].sourceRow).toBe(2);
  });

  it("signale la ligne fautive au lieu de la supprimer", () => {
    const csv = [
      "client_name,invoice_reference,invoice_amount,invoice_issued_at,invoice_due_at",
      "Acme,FAC-1,abc,2026-03-01,2026-03-31",
      ",FAC-2,100,2026-03-01,2026-03-31",
      "Nexus,FAC-3,1 250,2026-03-01,2026-02-01",
    ].join("\n");
    const r = importParserService.parseCSV(csv);
    expect(r.rows).toHaveLength(0);
    expect(r.errors.map((e) => e.row)).toEqual([2, 3, 4]);
    expect(r.errors[0].message).toContain("invoice_amount");
    expect(r.errors[2].message).toContain("antérieure");
  });

  it("tolère accents, majuscules et BOM dans les en-têtes", () => {
    const csv = "﻿Client Name,Invoice Reference,Invoice Amount,Invoice Issued At,Invoice Due At\nAcme,FAC-9,100,2026-01-01,2026-02-01";
    const r = importParserService.parseCSV(csv);
    expect(r.rows).toHaveLength(1);
  });

  it("refuse un fichier aux colonnes inconnues avec un message explicite", () => {
    const csv = "nom,montant\nAcme,100";
    expect(() => importParserService.parseCSV(csv)).toThrowError(/Colonnes non reconnues/);
  });
});
