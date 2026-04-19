"use client";

import { Card } from "@/components/ui/card";
import { useAttendance } from "../hooks/useAttendance";
import { AttendanceActions } from "./AttendanceActions";
import { AttendanceControls } from "./AttendanceControls";
import { AttendanceHeader } from "./AttendanceHeader";
import { AttendanceTable } from "./AttendanceTable";
import { MonthlyTracker } from "./MonthlyTracker";

export function AttendanceModule() {
  const {
    t,
    locale,
    router,
    isRtl,
    mode,
    setMode,
    institution,
    shift,
    rows,
    loading,
    pastSessions,
    availableNames,
    searchTerm,
    setSearchTerm,
    filteredAvailableNames,
    handleSave,
    handleDeleteAll,
    addRow,
    removeRow,
    updateRow,
    handleBulkAdd,
    handleFileUpload,
    handleExport,
    syncWithDatabase,
    formattedDate,
    registerName,
    setRegisterName,
    selectedScheduleId,
    setSelectedScheduleId,
    scheduledRegisterNames,
    sessionCreatedAt,
    startNewRegister,
    currentMonth,
    currentMonthIndex,
    currentYear,
    getMonthlyData,
    isAuthenticated,
  } = useAttendance();

  return (
    <div
      className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-2 print:bg-white print:p-0"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* --- Action Bar --- */}
      <AttendanceActions
        mode={mode}
        setMode={setMode}
        router={router}
        isRtl={isRtl}
        t={t}
        handleDeleteAll={handleDeleteAll}
        handleSave={handleSave}
        loading={loading}
        locale={locale}
        registerName={registerName}
        selectedScheduleId={selectedScheduleId}
        sessionCreatedAt={sessionCreatedAt}
        canEdit={canEdit}
        isAuthenticated={isAuthenticated}
      />

      {/* --- Attendance Register Card --- */}
      <Card className="max-w-6xl mx-auto shadow-2xl border-none print:shadow-none print:bg-white overflow-hidden bg-white dark:bg-slate-900">
        <AttendanceHeader
          t={t}
          institution={institution}
          isRtl={isRtl}
          formattedDate={formattedDate}
          shift={shift}
          registerName={registerName}
          setRegisterName={setRegisterName}
          selectedScheduleId={selectedScheduleId}
          setSelectedScheduleId={setSelectedScheduleId}
          sessionCreatedAt={sessionCreatedAt}
          mode={mode}
          locale={locale}
          scheduledRegisterNames={scheduledRegisterNames}
          canEdit={canEdit}
        />

        {/* --- Entry Form (Edit Mode) --- */}
        {mode === "edit" && (
          <AttendanceControls
            isRtl={isRtl}
            t={t}
            handleFileUpload={handleFileUpload}
            handleBulkAdd={handleBulkAdd}
            handleExport={handleExport}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            availableNames={availableNames}
            filteredAvailableNames={filteredAvailableNames}
            addRow={addRow}
          />
        )}

        {/* --- Register Table --- */}
        <AttendanceTable
          rows={rows}
          mode={mode}
          isRtl={isRtl}
          t={t}
          registerName={registerName}
          scheduleId={selectedScheduleId}
          formattedDate={formattedDate}
          updateRow={updateRow}
          removeRow={removeRow}
        />

        {/* Footer for print */}
        {/* <PrintFooter /> */}
      </Card>

      {/* --- Monthly History Summary --- */}
      {selectedScheduleId && (
        <MonthlyTracker
          scheduleId={selectedScheduleId}
          currentMonthIndex={currentMonthIndex}
          currentYear={currentYear}
          isRtl={isRtl}
          getMonthlyData={getMonthlyData}
          t={t}
          locale={locale}
        />
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            background-color: white !important;
          }
          .dark {
            color-scheme: light;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
