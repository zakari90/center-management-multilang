import { Button } from "@/freecomponents/ui/button";
import ExcelJS from "exceljs";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Schedule, TeacherWithSchedule } from "./types";
import { calculateHoursDifference, isWithinAvailability } from "./utils";
// DAYS is often just an array, let's define it here or import it if I find it.
// In the original file it was locally defined. Let's define it in utils or consts.
// For now, I'll define it locally to be safe, or move it to utils.

const DAYS_ARRAY = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const exportTeacherSchedule = (teacher: TeacherWithSchedule, t: any) => {
  let text = `${t("title")} - ${teacher.name}\n`;
  text += `${"=".repeat(50)}\n\n`;
  text += `Email: ${teacher.email || "N/A"}\n`;
  text += `${t("phone")}: ${teacher.phone || "N/A"}\n`;
  text += `${t("available")} ${t("hours")}/Week: ${teacher.availableHours.toFixed(1)}${t("hours")}\n`;
  text += `${t("scheduled")} ${t("hours")}/Week: ${teacher.totalHours.toFixed(1)}${t("hours")}\n`;
  text += `${t("utilization")}: ${teacher.utilizationRate}%\n\n`;

  text += `${t("availableHours").toUpperCase()}:\n`;
  text += `${"-".repeat(50)}\n`;
  if (teacher.weeklySchedule.length > 0) {
    teacher.weeklySchedule.forEach((slot) => {
      text += `  ${slot.day.padEnd(12)} ${slot.startTime} - ${slot.endTime}\n`;
    });
  } else {
    text += `  ${t("noAvailability")}\n`;
  }
  text += "\n";

  if (teacher.conflicts.length > 0) {
    text += `⚠️  ${t("conflictsAlert").toUpperCase()} (${teacher.conflicts.length}):\n`;
    text += `${"-".repeat(50)}\n`;
    teacher.conflicts.forEach((conflict) => {
      const availability = teacher.weeklySchedule.find(
        (s) => s.day === conflict.day,
      );
      text += `  ⚠️  ${conflict.day} ${conflict.startTime}-${conflict.endTime}: ${conflict.subject.name} (${conflict.subject.grade})\n`;
      if (availability) {
        text += `      ${t("available")}: ${availability.startTime}-${availability.endTime}\n`;
      } else {
        text += `      ${t("notAvailableOn")} ${conflict.day}\n`;
      }
    });
    text += "\n";
  }

  text += `${t("classes").toUpperCase()}:\n`;
  text += `${"-".repeat(50)}\n`;
  const schedulesByDay = teacher.schedules.reduce(
    (acc, schedule) => {
      if (!acc[schedule.day]) acc[schedule.day] = [];
      acc[schedule.day].push(schedule);
      return acc;
    },
    {} as Record<string, Schedule[]>,
  );

  DAYS_ARRAY.forEach((day) => {
    const daySchedules = schedulesByDay[day] || [];
    if (daySchedules.length > 0) {
      text += `\n${day}:\n`;
      daySchedules
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .forEach((schedule) => {
          const withinAvailability = isWithinAvailability(
            schedule,
            teacher.weeklySchedule,
          );
          const status = withinAvailability ? "✓" : "⚠";
          text += `  ${status} ${schedule.startTime}-${schedule.endTime}: ${schedule.subject.name} (${schedule.subject.grade}) - ${t("room")}: ${schedule.roomId}\n`;
        });
    }
  });

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${teacher.name.replace(/\s+/g, "_")}_schedule.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportTeacherScheduleToExcel = async (
  teacher: TeacherWithSchedule,
  t: any,
) => {
  const workbook = new ExcelJS.Workbook();

  // ==================== Sheet 1: Teacher Info ====================
  const infoSheet = workbook.addWorksheet("Teacher Info");

  infoSheet.columns = [
    { header: "Field", key: "field", width: 25 },
    { header: "Value", key: "value", width: 30 },
  ];

  // Add header style
  infoSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  infoSheet.getRow(1).fill = {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };

  const infoData = [
    { field: t("title"), value: teacher.name },
    { field: "Email", value: teacher.email || "N/A" },
    { field: t("phone"), value: teacher.phone || "N/A" },
    { field: "", value: "" },
    { field: "Statistics", value: "" },
    {
      field: `${t("available")} ${t("hours")}/Week`,
      value: `${teacher.availableHours.toFixed(1)} ${t("hours")}`,
    },
    {
      field: `${t("scheduled")} ${t("hours")}/Week`,
      value: `${teacher.totalHours.toFixed(1)} ${t("hours")}`,
    },
    { field: t("utilization"), value: `${teacher.utilizationRate}%` },
    { field: t("classes"), value: teacher.schedules.length },
    { field: t("subjects"), value: teacher.subjectsCount },
    { field: t("conflict"), value: teacher.conflicts.length },
  ];

  infoSheet.addRows(infoData);

  // ==================== Sheet 2: Availability ====================
  const availabilitySheet = workbook.addWorksheet(t("availableHours"));

  availabilitySheet.columns = [
    { header: "Day", key: "day", width: 15 },
    { header: "Start Time", key: "startTime", width: 12 },
    { header: "End Time", key: "endTime", width: 12 },
    { header: `Duration (${t("hours")})`, key: "duration", width: 15 },
  ];

  availabilitySheet.getRow(1).font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  availabilitySheet.getRow(1).fill = {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };

  const availabilityData = teacher.weeklySchedule.map((slot) => ({
    day: slot.day,
    startTime: slot.startTime,
    endTime: slot.endTime,
    duration: calculateHoursDifference(slot.startTime, slot.endTime).toFixed(1),
  }));

  availabilitySheet.addRows(availabilityData);

  // Add total row
  availabilitySheet.addRow({});
  const totalRow = availabilitySheet.addRow({
    day: `Total ${t("available")} ${t("hours")}:`,
    duration: teacher.availableHours.toFixed(1),
  });
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FFF2F2F2" },
  };

  // ==================== Sheet 3: Scheduled Classes ====================
  const schedulesSheet = workbook.addWorksheet(t("classes"));

  schedulesSheet.columns = [
    { header: "Day", key: "day", width: 12 },
    { header: "Start Time", key: "startTime", width: 12 },
    { header: "End Time", key: "endTime", width: 12 },
    { header: "Subject", key: "subject", width: 20 },
    { header: "Grade", key: "grade", width: 10 },
    { header: t("room"), key: "room", width: 12 },
    { header: `Duration (${t("hours")})`, key: "duration", width: 12 },
    { header: "Status", key: "status", width: 12 },
  ];

  schedulesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  schedulesSheet.getRow(1).fill = {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };

  const sortedSchedules = [...teacher.schedules].sort((a, b) => {
    const dayCompare = DAYS_ARRAY.indexOf(a.day) - DAYS_ARRAY.indexOf(b.day);
    if (dayCompare !== 0) return dayCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const schedulesData = sortedSchedules.map((schedule) => {
    const duration = calculateHoursDifference(
      schedule.startTime,
      schedule.endTime,
    );
    const withinAvailability = isWithinAvailability(
      schedule,
      teacher.weeklySchedule,
    );
    const status = withinAvailability ? "✓ OK" : `⚠ ${t("conflict")}`;

    return {
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      subject: schedule.subject.name,
      grade: schedule.subject.grade,
      room: schedule.roomId,
      duration: duration.toFixed(1),
      status,
    };
  });

  schedulesSheet.addRows(schedulesData);

  // Add total row
  schedulesSheet.addRow({});
  const schedulesTotalRow = schedulesSheet.addRow({
    day: `Total ${t("scheduled")} ${t("hours")}:`,
    duration: teacher.totalHours.toFixed(1),
  });
  schedulesTotalRow.font = { bold: true };
  schedulesTotalRow.fill = {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FFF2F2F2" },
  };

  // Color code status column
  schedulesSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const statusCell = row.getCell("status");
      if (statusCell.value?.toString().includes("OK")) {
        statusCell.fill = {
          type: "pattern" as const,
          pattern: "solid",
          fgColor: { argb: "FFC6EFCE" },
        };
        statusCell.font = { color: { argb: "FF006100" } };
      } else if (statusCell.value?.toString().includes("⚠")) {
        statusCell.fill = {
          type: "pattern" as const,
          pattern: "solid",
          fgColor: { argb: "FFFFEB9C" },
        };
        statusCell.font = { color: { argb: "FF9C6500" } };
      }
    }
  });

  // ==================== Sheet 4: Conflicts ====================
  if (teacher.conflicts.length > 0) {
    const conflictsSheet = workbook.addWorksheet(t("conflict"));

    conflictsSheet.columns = [
      { header: "Day", key: "day", width: 12 },
      { header: "Scheduled Time", key: "scheduledTime", width: 18 },
      { header: "Subject", key: "subject", width: 20 },
      { header: "Grade", key: "grade", width: 10 },
      { header: t("room"), key: "room", width: 12 },
      { header: `${t("available")} Time`, key: "availableTime", width: 18 },
      { header: "Issue", key: "issue", width: 40 },
    ];

    conflictsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    conflictsSheet.getRow(1).fill = {
      type: "pattern" as const,
      pattern: "solid",
      fgColor: { argb: "FFC00000" },
    };

    const conflictsData = teacher.conflicts.map((conflict) => {
      const availability = teacher.weeklySchedule.find(
        (s) => s.day === conflict.day,
      );
      const issue = availability
        ? `${t("outsideAvailableHours")} (${availability.startTime}-${availability.endTime})`
        : `${t("notAvailableOn")} ${conflict.day}`;

      return {
        day: conflict.day,
        scheduledTime: `${conflict.startTime} - ${conflict.endTime}`,
        subject: conflict.subject.name,
        grade: conflict.subject.grade,
        room: conflict.roomId,
        availableTime: availability
          ? `${availability.startTime} - ${availability.endTime}`
          : "N/A",
        issue,
      };
    });

    conflictsSheet.addRows(conflictsData);

    // Highlight conflict rows
    conflictsSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.fill = {
          type: "pattern" as const,
          pattern: "solid",
          fgColor: { argb: "FFFFE6E6" },
        };
      }
    });
  }

  // ==================== Sheet 5: Weekly Overview ====================
  const weeklySheet = workbook.addWorksheet(t("weeklyTimeline"));

  const timeSlots = [
    "06:00",
    "07:00",
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
    "19:00",
    "20:00",
  ];

  weeklySheet.columns = [
    { header: "Time", key: "time", width: 8 },
    ...DAYS_ARRAY.map((day) => ({ header: day, key: day, width: 18 })),
  ];

  weeklySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  weeklySheet.getRow(1).fill = {
    type: "pattern" as const,
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };

  timeSlots.forEach((time) => {
    const row: Record<string, string> = { time };

    DAYS_ARRAY.forEach((day) => {
      const schedule = teacher.schedules.find(
        (s) => s.day === day && s.startTime <= time && s.endTime > time,
      );

      if (schedule) {
        row[day] = `${schedule.subject.name} (${schedule.roomId})`;
      } else {
        const isAvailable = teacher.weeklySchedule.some(
          (slot) =>
            slot.day === day && slot.startTime <= time && slot.endTime > time,
        );
        row[day] = isAvailable ? t("available") : "-";
      }
    });

    weeklySheet.addRow(row);
  });

  // Color code weekly overview
  weeklySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      DAYS_ARRAY.forEach((day) => {
        const cell = row.getCell(day);
        if (cell.value === t("available")) {
          cell.fill = {
            type: "pattern" as const,
            pattern: "solid",
            fgColor: { argb: "FFC6EFCE" },
          };
        } else if (cell.value && cell.value !== "-") {
          cell.fill = {
            type: "pattern" as const,
            pattern: "solid",
            fgColor: { argb: "FFDFE9F3" },
          };
        }
      });
    }
  });

  // Save file
  const fileName = `${teacher.name.replace(/\s+/g, "_")}_schedule_${new Date().toISOString().split("T")[0]}.xlsx`;
  await workbook.xlsx.writeFile(fileName);
};

export function ExportButton({ teacher }: { teacher: TeacherWithSchedule }) {
  const t = useTranslations("TeacherScheduleView");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
        <Download className="h-4 w-4 mr-2" />
        {t("export")}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border z-20 overflow-hidden">
            <button
              onClick={() => {
                exportTeacherScheduleToExcel(teacher, t);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t("exportToExcel")}
            </button>
            <button
              onClick={() => {
                exportTeacherSchedule(teacher, t);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {t("exportToText")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
