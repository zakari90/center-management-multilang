"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash } from "lucide-react";

export function DeleteAllDataButton() {
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const t = useTranslations("deleteALL");
  const router = useRouter();

  const handleDelete = async () => {
    setStatus(null);
    try {
      await axios.post("/api/admin/delete-all");
      setStatus(t("allDataDeletedSuccessfully"));
      setConfirm(false);
      router.refresh();
    } catch {
      setStatus(t("failedToDeleteData"));
      setConfirm(false);
    }
  };

  return (
    <div className="my-6">
      {status && (
        <Alert className="mb-4">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}
      {confirm ? (
        <div>
          <p className="mb-2">
            {t("areYouSureDeleteAllData")} <strong>{t("deleteAllData")}</strong>? {t("cannotBeUndone")}
          </p>
          <Button onClick={handleDelete} variant="destructive" className="mr-2">
            <Trash className="inline w-4 h-4 mr-1" />
            {t("yesDeleteEverything")}
          </Button>
          <Button onClick={() => setConfirm(false)} variant="outline">
            {t("cancel")}
          </Button>
        </div>
      ) : (
        <Button onClick={() => setConfirm(true)} variant="destructive">
          <Trash className="inline w-4 h-4 mr-1" />
          {t("deleteAllData")}
        </Button>
      )}
    </div>
  );
}
