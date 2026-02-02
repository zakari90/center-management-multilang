"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Pencil, Trash2, Coins, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { Subject } from "@/lib/dexie/dbSchema";
import { EditSubjectCard } from "./editSubjectCard";

interface SubjectsTableViewProps {
  subjects: Subject[];
  onUpdate: (id: string, data: Partial<any>) => void;
  onDelete: (id: string) => void;
  availableSubjects: string[];
  availableGrades: string[];
}

export function SubjectsTableView({
  subjects,
  onUpdate,
  onDelete,
  availableSubjects,
  availableGrades,
}: SubjectsTableViewProps) {
  const t = useTranslations("CenterPresentation");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return subjects;
    const lowerQuery = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.grade.toLowerCase().includes(lowerQuery),
    );
  }, [subjects, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder") || "Search subjects or grades..."}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 border-b">{t("subjectName")}</th>
                <th className="px-4 py-3 border-b">{t("grade")}</th>
                <th className="px-4 py-3 border-b">{t("price")}</th>
                <th className="px-4 py-3 border-b">{t("durationHeader")}</th>
                <th className="px-4 py-3 border-b text-right">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground italic"
                  >
                    {t("noSubjects") || "No subjects found"}
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {subject.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className="font-bold whitespace-nowrap"
                      >
                        {subject.grade}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-primary font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {subject.price} MAD
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {subject.duration ? (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                          <Clock className="h-3 w-3" />
                          {subject.duration}h
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* We use EditSubjectCard's trigger logic but only for the buttons */}
                      <div className="flex justify-end items-center scale-90 origin-right">
                        <EditSubjectCard
                          subject={subject}
                          onUpdate={onUpdate}
                          onDelete={onDelete}
                          availableSubjects={availableSubjects}
                          availableGrades={availableGrades}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
