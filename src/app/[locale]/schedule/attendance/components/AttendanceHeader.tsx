import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarX2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
  mode: "view" | "edit";
  locale: string;
  scheduledRegisterNames?: { id: string; label: string }[];
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
  mode,
  locale,
  scheduledRegisterNames = [],
}: AttendanceHeaderProps) {
  const tSchedule = useTranslations("AttendanceRegister");

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
              {isRtl ? "اسم السجل" : "Register Name"} : {institution}
            </p>
            <div className="w-full max-w-sm space-y-2">
              {/* Banner: shown when no group is matched for the current day/time */}
              {!registerName && (
                <div className="flex items-center gap-3 w-[300px] h-12 px-4 rounded-md border border-dashed border-amber-300 dark:border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 select-none">
                  <CalendarX2 className="h-5 w-5 shrink-0 opacity-70" />
                  <p className="text-xs font-semibold leading-tight">
                    {tSchedule("noGroupsForPeriod")}
                  </p>
                </div>
              )}

              {/* Dropdown: always shown when there are schedule entries */}
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
                        t("registerNamePlaceholder") || "Select Register"
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
                {isRtl ? "أنشئ في:" : "Created:"}
              </span>
              <span>{creationDateText}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              {isRtl ? "التاريخ" : "Date"}
            </p>
            <p className="text-xl font-black text-slate-800 dark:text-white print:text-black">
              {formattedDate}
            </p>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
              {isRtl ? "الفترة" : "Shift"}
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
