import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarX2 } from "lucide-react";

interface AttendanceHeaderProps {
  t: any;
  institution: string;
  isRtl: boolean;
  formattedDate: string;
  shift: string;
  registerName: string;
  setRegisterName: (name: string) => void;
  selectedScheduleId: string;
  setSelectedScheduleId: (id: string) => void;
  sessionCreatedAt: number | null;
  locale: string;
  scheduledRegisterNames?: { id: string; label: string }[];
  pastRegisterNames?: string[];
}

export function AttendanceHeader({
  t,
  institution,
  isRtl,
  formattedDate,
  shift,
  registerName,
  setRegisterName,
  selectedScheduleId,
  setSelectedScheduleId,
  sessionCreatedAt,
  locale,
  scheduledRegisterNames = [],
  pastRegisterNames = [],
}: AttendanceHeaderProps) {
  const tSchedule = t;

  const creationDateText = sessionCreatedAt
    ? new Date(sessionCreatedAt).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-start space-y-2 flex-1 max-w-md">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 px-1">
              {t("registerName")} : {registerName}
            </p>
            <div className="w-full max-w-sm space-y-2">
              {/* If there are no groups, allow manual input of register name */}
              {scheduledRegisterNames.length === 0 && (
                <div className="relative">
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder={t("registerNamePlaceholder")}
                    list="past-register-names"
                    className="w-[300px] text-xl font-black uppercase h-12 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-900 rounded-md px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="past-register-names">
                    {pastRegisterNames.map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                  <div className="absolute top-14 left-0 flex items-center gap-2 w-[300px] px-2 py-1.5 rounded border border-dashed border-amber-300 dark:border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 select-none">
                    <CalendarX2 className="h-4 w-4 shrink-0 opacity-70" />
                    <p className="text-[10px] font-semibold leading-tight">
                      {t("noGroupsForPeriod")}
                    </p>
                  </div>
                </div>
              )}

              {/* Dropdown: shown when there are schedule entries */}
              {scheduledRegisterNames.length > 0 && (
                <Select
                  value={selectedScheduleId || registerName}
                  onValueChange={(val) => {
                    const entry = scheduledRegisterNames.find(
                      (e) => e.id === val || e.label === val,
                    );
                    if (entry) {
                      setSelectedScheduleId(entry.id);
                      setRegisterName(entry.label);
                    } else {
                      setRegisterName(val);
                      setSelectedScheduleId("");
                    }
                  }}
                >
                  <SelectTrigger className="w-[300px] text-xl font-black uppercase h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-900">
                    <SelectValue
                      placeholder={
                        t("registerNamePlaceholder")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduledRegisterNames.map((entry) => (
                      <SelectItem
                        key={entry.id}
                        value={entry.id}
                        className="uppercase font-bold"
                      >
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {sessionCreatedAt && (
            <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] text-slate-400 font-medium italic">
              <span className="opacity-70">
                {t("created")}
              </span>
              <span>{creationDateText}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              {t("date")}
            </p>
            <p className="text-xl font-black text-slate-800 dark:text-white print:text-black">
              {formattedDate}
            </p>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              {t("shift")}
            </p>
            <p className="text-xl font-black text-indigo-600 uppercase">
              {t(shift)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
