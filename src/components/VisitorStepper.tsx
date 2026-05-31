"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface VisitorStepperProps {
  count: number;
  notes: string | null;
  onIncrement: () => void;
  onDecrement: () => void;
  onNotesChange: (notes: string | null) => void;
}

export function VisitorStepper({ count, notes, onIncrement, onDecrement, onNotesChange }: VisitorStepperProps) {
  const [showNotes, setShowNotes] = useState(!!notes);
  const { theme } = useTheme();

  return (
    <div
      className="mx-4 mt-4 rounded-xl border p-4"
      style={{ borderColor: theme.primaryBorder, backgroundColor: `${theme.primaryLight}40` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">👥 Visitantes sin nombre</span>
        <span className="text-xs text-gray-500">{count} {count === 1 ? "visitante" : "visitantes"}</span>
      </div>

      {/* Stepper controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onDecrement}
          disabled={count === 0}
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all active:scale-90 disabled:opacity-30"
          style={{ backgroundColor: theme.primaryLight, color: theme.primary, border: `2px solid ${theme.primaryBorder}` }}
        >
          −
        </button>
        <span
          className="text-4xl font-bold min-w-[3rem] text-center"
          style={{ color: theme.primary }}
        >
          {count}
        </span>
        <button
          onClick={onIncrement}
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white transition-all active:scale-90"
          style={{ background: theme.buttonGradient }}
        >
          +
        </button>
      </div>

      {/* Notes toggle & input */}
      <div className="mt-3">
        {!showNotes ? (
          <button
            onClick={() => setShowNotes(true)}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            📝 Agregar nota (opcional)
          </button>
        ) : (
          <input
            type="text"
            value={notes ?? ""}
            onChange={(e) => onNotesChange(e.target.value || null)}
            placeholder="Ej: Evento de jóvenes, visitantes extras..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        )}
      </div>
    </div>
  );
}
