import React from "react";
import { UserPlus, Plus } from "lucide-react";
import type { ExtraGuest } from "../../types/CheckIn";

interface ExtraGuestsTableProps {
  extraGuests: ExtraGuest[];
  onAddRow: () => void;
  onChange: (index: number, field: keyof ExtraGuest, value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
}

export default function ExtraGuestsTable({
  extraGuests,
  onAddRow,
  onChange,
  onKeyDown,
}: ExtraGuestsTableProps) {
  return (
    <div className="p-5 flex-1">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
          <UserPlus size={14} className="text-emerald-600" /> Additional Guests
        </div>
        <button
          onClick={onAddRow}
          className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded"
        >
          <Plus size={12} /> Add Row
        </button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase w-20">
                Title
              </th>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase">
                Full Name <span className="text-red-500">*</span>
              </th>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase w-24">
                Table <span className="text-red-500">*</span>
              </th>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 uppercase w-24">
                Seat <span className="text-red-500">*</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {extraGuests.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-xs text-slate-400 italic"
                >
                  No additional guests. Click "Add Row" or check-in registered
                  guests.
                </td>
              </tr>
            ) : (
              extraGuests.map((guest, index) => (
                <tr key={index} className="bg-emerald-50/20">
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      placeholder="Mr/Ms"
                      value={guest.title}
                      onChange={(e) => onChange(index, "title", e.target.value)}
                      onKeyDown={(e) => onKeyDown(e, index)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 bg-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      placeholder="Extra Guest Name"
                      value={guest.name}
                      onChange={(e) => onChange(index, "name", e.target.value)}
                      onKeyDown={(e) => onKeyDown(e, index)}
                      autoFocus
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 bg-white"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={guest.table_number}
                      onChange={(e) =>
                        onChange(index, "table_number", e.target.value)
                      }
                      onKeyDown={(e) => onKeyDown(e, index)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 bg-white font-mono uppercase"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={guest.seat_number}
                      onChange={(e) =>
                        onChange(index, "seat_number", e.target.value)
                      }
                      onKeyDown={(e) => onKeyDown(e, index)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 bg-white font-mono uppercase"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[10px] text-slate-500">
        *Tekan <b>Enter</b> di kolom input untuk menambah baris secara otomatis.
      </div>
    </div>
  );
}
