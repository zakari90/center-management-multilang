"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";
import { useTranslations } from "next-intl";

type EditDialogProps = {
  title: string;
  trigger: ReactNode;
  children: ReactNode;
  onSave: () => void;
};

export function EditDialog({
  title,
  trigger,
  children,
  onSave,
}: EditDialogProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("EditDialog");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md max-h-[96vh] flex flex-col overflow-hidden p-0">
        <div className="p-4 sm:p-6 pb-2 sm:pb-3 border-b shrink-0">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-3">
          <div className="space-y-4 py-2">{children}</div>
        </div>

        <div className="p-4 sm:p-6 pt-2 sm:pt-3 border-t shrink-0 bg-muted/5">
          <DialogFooter className="sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                onSave();
                setOpen(false);
              }}
            >
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
