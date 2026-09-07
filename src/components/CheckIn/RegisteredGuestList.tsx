import { Users, CheckCircle2 } from "lucide-react";

interface RegisteredGuestsListProps {
  initialGuests: any[];
  selectedGuestIds: string[];
  onToggleSelection: (guestId: string) => void;
}

export default function RegisteredGuestsList({
  initialGuests,
  selectedGuestIds,
  onToggleSelection,
}: RegisteredGuestsListProps) {
  return (
    <div className="p-5 border-b border-slate-200">
      <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
        <Users size={14} className="text-blue-600" /> Registered Guests
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        {initialGuests.map((guest) => {
          const isAlreadyCheckedIn = !!guest.checked_in_at;
          const isAbsent = !!guest.is_absent;
          const isChecked = selectedGuestIds.includes(guest.guest_d_id);

          return (
            <label
              key={guest.guest_d_id}
              className={`flex items-center gap-3 p-3 border-b border-slate-100 last:border-0 transition-colors ${
                isAlreadyCheckedIn || isAbsent
                  ? "bg-slate-50 cursor-default"
                  : "hover:bg-blue-50 cursor-pointer"
              }`}
            >
              <div className="relative flex items-center pl-1">
                <input
                  type="checkbox"
                  disabled={isAlreadyCheckedIn || isAbsent}
                  checked={!isAbsent && (isAlreadyCheckedIn || isChecked)}
                  onChange={() =>
                    !isAlreadyCheckedIn &&
                    !isAbsent &&
                    onToggleSelection(guest.guest_d_id)
                  }
                  className="w-4 h-4 border border-slate-300 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex-1">
                <div
                  className={`text-xs font-bold ${isAlreadyCheckedIn ? "text-slate-500 line-through" : "text-slate-900"}`}
                >
                  {guest.title} {guest.name}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Table {guest.table_number || "-"} • Seat{" "}
                  {guest.seat_number || "-"}
                </div>
              </div>
              <div className="text-right pr-1">
                {isAbsent ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    <CheckCircle2 size={12} /> Absent
                  </span>
                ) : isAlreadyCheckedIn ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                    <CheckCircle2 size={12} /> Checked In
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                    Pending
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
