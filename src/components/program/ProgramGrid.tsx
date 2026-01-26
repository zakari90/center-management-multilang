"use client";

import { useTranslations } from "next-intl";
import { ScheduleSlot, Teacher, Subject } from "./ProgramView";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Clock } from "lucide-react";

interface ProgramGridProps {
  schedules: ScheduleSlot[];
  teachers: Teacher[];
  subjects: Subject[];
  onSlotClick: (day: string, startTime: string, endTime: string) => void;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export function ProgramGrid({
  schedules,
  teachers,
  subjects,
  onSlotClick,
}: ProgramGridProps) {
  const t = useTranslations("Program");

  const getSchedulesForSlot = (day: string, startTime: string) => {
    return schedules.filter((s) => s.day === day && s.startTime === startTime);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 bg-background shadow-sm">
      <div className="min-w-[1200px]">
        {/* Day Headers */}
        <div className="grid grid-cols-8 sticky top-0 bg-muted/40 backdrop-blur-sm z-20 border-b divide-x divide-border/30">
          <div className="p-4 font-bold text-center text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-center">
            <Clock className="w-4 h-4 mr-2" />
            {t("time") || "TIME"}
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-4 font-bold text-center text-xs uppercase tracking-widest text-primary/80"
            >
              {t(`days.${day}`) || day}
            </div>
          ))}
        </div>

        {/* Time Grid Rows */}
        <div className="divide-y divide-border/30">
          {TIME_SLOTS.slice(0, -1).map((startTime, index) => {
            const endTime = TIME_SLOTS[index + 1];
            return (
              <div
                key={startTime}
                className="grid grid-cols-8 divide-x divide-border/30"
              >
                {/* Time Label Column */}
                <div className="p-3 text-xs font-semibold text-muted-foreground/80 flex flex-col items-center justify-center bg-muted/10 sticky left-0 z-10">
                  <span className="text-foreground">{startTime}</span>
                  <span className="opacity-50">—</span>
                  <span>{endTime}</span>
                </div>

                {/* Day Cells */}
                {DAYS.map((day) => {
                  const slots = getSchedulesForSlot(day, startTime);

                  return (
                    <div
                      key={`${day}-${startTime}`}
                      className={cn(
                        "min-h-[140px] p-2 transition-all hover:bg-primary/5 cursor-pointer relative group",
                        slots.length === 0 ? "bg-background/40" : "bg-card",
                      )}
                      onClick={() => onSlotClick(day, startTime, endTime)}
                    >
                      {/* Empty Slot Interface */}
                      {slots.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                            + {t("assign") || "Assign"}
                          </div>
                        </div>
                      )}

                      {/* Display Occupied Slots */}
                      <div className="space-y-2">
                        {slots.map((s) => {
                          const teacher = teachers.find(
                            (t) => t.id === s.teacherId,
                          );
                          const subject = subjects.find(
                            (sub) => sub.id === s.subjectId,
                          );

                          return (
                            <div
                              key={s.id}
                              className="group/item border-l-4 border-l-primary bg-primary/5 rounded-r-lg p-2 text-xs space-y-2 hover:bg-primary/10 transition-colors shadow-sm"
                            >
                              <div className="font-bold text-primary leading-tight line-clamp-2">
                                {subject?.name ||
                                  t("unknownSubject") ||
                                  "Unknown Subject"}
                              </div>

                              <div className="space-y-1">
                                <div
                                  className="flex items-center gap-1.5 text-muted-foreground/90 font-medium truncate"
                                  title={teacher?.name}
                                >
                                  <User className="h-3 w-3 text-primary/60 shrink-0" />
                                  {teacher?.name || "???"}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 tracking-tight">
                                    <MapPin className="h-3 w-3 text-primary/40 shrink-0" />
                                    {s.roomId}
                                  </div>
                                  {subject?.grade && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[9px] px-1 py-0 h-4 font-normal bg-primary/10 text-primary hover:bg-primary/20"
                                    >
                                      {subject.grade}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
