"use client";

/**
 * @file page.tsx
 * @description Page d'importation de fichiers CSV et Excel pour Solvia SaaS.
 * Permet aux utilisateurs d'importer en masse leurs factures et clients,
 * de télécharger des fichiers modèles prêts à l'emploi (CSV et Excel),
 * et de visualiser le résultat immédiat de l'intégration dans leur base de données.
 *
 * Conforme aux directives : zéro emoji, zéro dégradé, palette Maquette 1, JSDoc exhaustif.
 *
 * @module app/(dashboard)/import
 */

import { useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

/**
 * Structure du résultat renvoyé par l'API d'importation.
 */
interface ImportApiResponse {
  clientsCreated: number;
  clientsExisting: number;
  invoicesCreated: number;
  errors: Array<{ row: number; message: string }>;
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fichier sélectionné par l'utilisateur
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // États du traitement
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImportApiResponse | null>(null);

  /**
   * Génère et télécharge un fichier modèle CSV pré-rempli.
   */
  function handleDownloadSampleCSV() {
    const headers = [
      "client_name",
      "client_email",
      "client_phone",
      "external_code",
      "invoice_reference",
      "invoice_amount",
      "invoice_issued_at",
      "invoice_due_at",
    ];

    const today = new Date();
    const pastDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const futureDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const overdueDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const sampleRows = [
      ["Acme SAS", "facturation@acme.fr", "+33140000001", "CLI-001", "FAC-2026-001", "4500.00", pastDate, overdueDate],
      ["Nexus Digital", "compta@nexus-digital.io", "+33140000002", "CLI-002", "FAC-2026-002", "1850.50", pastDate, futureDate],
      ["Atelier Dubois", "dubois@atelier.fr", "+33140000003", "CLI-003", "FAC-2026-003", "3200.00", pastDate, overdueDate],
    ];

    const csvContent = [
      headers.join(","),
      ...sampleRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modele_factures_solvia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Génère et télécharge un fichier modèle Excel (.xlsx) pré-rempli.
   */
  function handleDownloadSampleExcel() {
    const today = new Date();
    const pastDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const futureDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const overdueDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const data = [
      {
        client_name: "Acme SAS",
        client_email: "facturation@acme.fr",
        client_phone: "+33140000001",
        external_code: "CLI-001",
        invoice_reference: "FAC-2026-001",
        invoice_amount: 4500.00,
        invoice_issued_at: pastDate,
        invoice_due_at: overdueDate,
      },
      {
        client_name: "Nexus Digital",
        client_email: "compta@nexus-digital.io",
        client_phone: "+33140000002",
        external_code: "CLI-002",
        invoice_reference: "FAC-2026-002",
        invoice_amount: 1850.50,
        invoice_issued_at: pastDate,
        invoice_due_at: futureDate,
      },
      {
        client_name: "Atelier Dubois",
        client_email: "dubois@atelier.fr",
        client_phone: "+33140000003",
        external_code: "CLI-003",
        invoice_reference: "FAC-2026-003",
        invoice_amount: 3200.00,
        invoice_issued_at: pastDate,
        invoice_due_at: overdueDate,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Factures");
    XLSX.writeFile(workbook, "modele_factures_solvia.xlsx");
  }

  /**
   * Gestion de la sélection d'un fichier via input ou drag and drop.
   */
  function handleFileSelected(file: File) {
    setErrorMessage(null);
    setResult(null);

    const filename = file.name.toLowerCase();
    const isValidFormat =
      filename.endsWith(".csv") ||
      filename.endsWith(".xlsx") ||
      filename.endsWith(".xls");

    if (!isValidFormat) {
      setErrorMessage("Format de fichier non pris en charge. Veuillez sélectionner un fichier .csv ou .xlsx.");
      return;
    }

    setSelectedFile(file);
  }

  /**
   * Envoi du fichier à l'API d'importation Solvia.
   */
  async function handleSubmitImport() {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/v1/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Une erreur est survenue lors de l'importation.");
        setIsUploading(false);
        return;
      }

      setResult(data);
    } catch {
      setErrorMessage("Erreur de communication avec le serveur d'importation.");
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * Réinitialisation de la zone d'upload.
   */
  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête de la page */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Importer des factures & clients
          </h1>
          <p className="text-xs text-[#64748B]">
            Intégrez vos données de facturation par lot via fichier CSV ou Excel
          </p>
        </div>

        {/* Boutons de téléchargement des modèles */}
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            type="button"
            onClick={handleDownloadSampleCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC]"
          >
            <Download className="h-3.5 w-3.5 text-[#4F46E5]" />
            <span>Modèle CSV</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSampleExcel}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#10B981]" />
            <span>Modèle Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne Principale : Zone de dépôt et action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#0F172A] mb-4">
              Sélectionnez votre fichier de factures
            </h2>

            {/* Zone Drag & Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelected(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                isDragOver
                  ? "border-[#4F46E5] bg-[#EEF2FF]/40"
                  : selectedFile
                  ? "border-[#10B981] bg-[#ECFDF5]/20"
                  : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#94A3B8]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#E2E8F0] shadow-sm mb-3">
                {selectedFile ? (
                  <FileSpreadsheet className="h-6 w-6 text-[#10B981]" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-[#4F46E5]" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#0F172A]">{selectedFile.name}</p>
                  <p className="text-[11px] text-[#64748B]">
                    {(selectedFile.size / 1024).toFixed(1)} Ko &bull; Fichier prêt pour l&apos;importation
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#0F172A]">
                    Glissez votre fichier ici, ou cliquez pour parcourir
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Formats acceptés : CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
              )}
            </div>

            {/* Message d'erreur */}
            {errorMessage && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-3 text-xs text-[#991B1B]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="mt-6 flex items-center justify-end gap-3">
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isUploading}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  Annuler
                </button>
              )}

              <button
                type="button"
                onClick={handleSubmitImport}
                disabled={!selectedFile || isUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Traitement de l&apos;import en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Valider et importer les factures</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Rapport de Résultat */}
          {result && (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                <h2 className="text-sm font-bold text-[#0F172A]">
                  Rapport d&apos;importation terminé
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
                  <p className="text-[11px] font-semibold text-[#64748B] mb-1">Factures créées</p>
                  <p className="text-2xl font-bold text-[#4F46E5]">{result.invoicesCreated}</p>
                </div>
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
                  <p className="text-[11px] font-semibold text-[#64748B] mb-1">Nouveaux clients</p>
                  <p className="text-2xl font-bold text-[#10B981]">{result.clientsCreated}</p>
                </div>
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
                  <p className="text-[11px] font-semibold text-[#64748B] mb-1">Clients mis à jour</p>
                  <p className="text-2xl font-bold text-[#0F172A]">{result.clientsExisting}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mb-6 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-4">
                  <p className="text-xs font-bold text-[#991B1B] mb-2">
                    Lignes ignorées en raison d&apos;erreurs ({result.errors.length}) :
                  </p>
                  <ul className="space-y-1 text-xs text-[#991B1B]">
                    {result.errors.map((err, i) => (
                      <li key={i}>
                        Ligne {err.row} : {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#4F46E5] hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Importer un autre fichier</span>
                </button>

                <Link
                  href="/invoices"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1E293B]"
                >
                  <span>Voir mes factures</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Colonne Latérale : Instructions & Structure des colonnes */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm text-xs">
            <div className="flex items-center gap-2 text-[#0F172A] font-bold mb-3">
              <HelpCircle className="h-4 w-4 text-[#4F46E5]" />
              <span>Colonnes attendues</span>
            </div>
            <p className="text-[#64748B] mb-4 leading-relaxed">
              Pour une détection automatique sans configuration, nommez vos colonnes selon le format standard :
            </p>

            <div className="space-y-2.5">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                <p className="font-mono font-bold text-[#0F172A]">client_name</p>
                <p className="text-[11px] text-[#64748B]">Nom ou raison sociale (obligatoire)</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                <p className="font-mono font-bold text-[#0F172A]">invoice_reference</p>
                <p className="text-[11px] text-[#64748B]">Numéro unique de la facture (obligatoire)</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                <p className="font-mono font-bold text-[#0F172A]">invoice_amount</p>
                <p className="text-[11px] text-[#64748B]">Montant TTC numérique (obligatoire)</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                <p className="font-mono font-bold text-[#0F172A]">invoice_due_at</p>
                <p className="text-[11px] text-[#64748B]">Date d&apos;échéance (AAAA-MM-JJ)</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                <p className="font-mono font-bold text-[#0F172A]">client_email &amp; client_phone</p>
                <p className="text-[11px] text-[#64748B]">Coordonnées chiffrées pour les relances</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
