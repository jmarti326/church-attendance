"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface UploadResult {
  success: boolean;
  summary?: {
    membersCreated: number;
    familiesCreated: number;
    totalRows: number;
    mode: string;
  };
  error?: string;
}

export default function BatchUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;

    if (mode === "replace" && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    setUploading(true);
    setResult(null);
    setConfirmReplace(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const response = await fetch("/api/members/batch", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setResult({ success: true, summary: data.summary });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch {
      setResult({ success: false, error: "Error de conexión" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/members" className="text-white/80 hover:text-white">
            ← Miembros
          </Link>
          <h1 className="text-lg font-bold">Carga Masiva</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Instrucciones</h2>
          <p className="text-sm text-gray-600">
            Sube un archivo CSV con los miembros de la iglesia. El archivo debe
            tener las siguientes columnas:
          </p>
          <div className="bg-gray-50 rounded p-3 text-xs font-mono overflow-x-auto">
            firstName,lastName,phone,address,status,familyGroup
          </div>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>
              <strong>firstName</strong> y <strong>lastName</strong> son
              obligatorios
            </li>
            <li>
              <strong>status</strong>: member, visitor, members_class, pastor, inactive, fallecido
            </li>
            <li>
              <strong>familyGroup</strong>: nombre del grupo familiar (los que
              compartan el mismo nombre quedarán agrupados)
            </li>
            <li>
              <strong>phone</strong> y <strong>address</strong> son opcionales
            </li>
          </ul>
          <a
            href="/sample-batch-upload.csv"
            download
            className="inline-block mt-2 text-sm text-blue-600 underline hover:text-blue-800"
          >
            📥 Descargar archivo de ejemplo
          </a>
        </div>

        {/* Upload Mode */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Modo de carga</h2>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="mode"
                value="append"
                checked={mode === "append"}
                onChange={() => {
                  setMode("append");
                  setConfirmReplace(false);
                }}
                className="mt-0.5"
              />
              <div>
                <span className="font-medium text-sm">Agregar</span>
                <p className="text-xs text-gray-500">
                  Agrega los miembros al listado existente
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded border cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={mode === "replace"}
                onChange={() => {
                  setMode("replace");
                  setConfirmReplace(false);
                }}
                className="mt-0.5"
              />
              <div>
                <span className="font-medium text-sm">Reemplazar todo</span>
                <p className="text-xs text-gray-500">
                  ⚠️ Elimina TODOS los miembros y asistencias existentes y los
                  reemplaza con el archivo
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* File Input */}
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Archivo CSV</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
              setConfirmReplace(false);
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && (
            <p className="text-xs text-gray-500">
              📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Confirm Replace Warning */}
        {confirmReplace && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ ¿Estás seguro? Esto eliminará TODOS los miembros y registros
              de asistencia existentes.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded font-medium hover:bg-red-700"
              >
                Sí, reemplazar todo
              </button>
              <button
                onClick={() => setConfirmReplace(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded font-medium hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {!confirmReplace && (
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {uploading ? "Subiendo..." : "Subir Archivo"}
          </button>
        )}

        {/* Result */}
        {result && (
          <div
            className={`rounded-lg p-4 ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success && result.summary ? (
              <div className="space-y-2">
                <p className="text-green-800 font-medium">✅ Carga exitosa</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>
                    👥 Miembros creados: <strong>{result.summary.membersCreated}</strong>
                  </li>
                  <li>
                    👨‍👩‍👧‍👦 Familias creadas: <strong>{result.summary.familiesCreated}</strong>
                  </li>
                  <li>
                    📊 Filas procesadas: <strong>{result.summary.totalRows}</strong>
                  </li>
                </ul>
                <Link
                  href="/members"
                  className="inline-block mt-2 text-sm text-blue-600 underline"
                >
                  Ver miembros →
                </Link>
              </div>
            ) : (
              <p className="text-red-800 text-sm">❌ {result.error}</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
