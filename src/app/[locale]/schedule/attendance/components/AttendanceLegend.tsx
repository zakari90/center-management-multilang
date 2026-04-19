"use client";

interface AttendanceLegendProps {
  t: any;
}

export function AttendanceLegend({ t }: AttendanceLegendProps) {
  const statuses = [
    { key: "present", label: "P", color: "bg-emerald-500 border-emerald-500 text-white" },
    { key: "absent", label: "A", color: "bg-rose-500 border-rose-500 text-white" },
    { key: "late", label: "L", color: "bg-amber-500 border-amber-500 text-white" },
    { key: "leave", label: "LV", color: "bg-indigo-500 border-indigo-500 text-white" },
  ];

  return (
    <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t dark:border-slate-800 flex flex-wrap gap-6 text-[10px] items-center print:bg-transparent print:border-black">
      <span className="font-bold uppercase text-slate-400">
        {t("legend")}:
      </span>
      {statuses.map((st) => (
        <div key={st.key} className="flex items-center gap-2 capitalize">
          <span
            className={`w-5 h-5 rounded-sm border flex items-center justify-center text-[10px] font-black ${st.color}`}
          >
            {st.label}
          </span>
          <span className="font-medium text-slate-600 dark:text-slate-400 print:text-black">
            {t(`status.${st.key}`)}
          </span>
        </div>
      ))}
    </div>
  );
}
