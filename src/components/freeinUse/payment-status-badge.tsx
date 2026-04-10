import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@/freelib/payment-utils";
import { format } from "date-fns";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  showAmount?: boolean;
}

export function PaymentStatusBadge({
  status,
  showAmount = false,
}: PaymentStatusBadgeProps) {
  const t = useTranslations("AdminReceiptsTable");

  if (status.isPaid) {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {t("paid") || "Paid"}
        {showAmount && ` (${status.amountPaid} MAD)`}
      </Badge>
    );
  }

  if (status.status === "PARTIAL") {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 gap-1">
        <Clock className="w-3 h-3" />
        {t("partial") || "Partial"}
        {showAmount && ` (${status.amountPaid} MAD)`}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-red-50 text-red-600 border-red-200 gap-1"
    >
      <AlertCircle className="w-3 h-3" />
      {t("unpaid") || "Unpaid"}
    </Badge>
  );
}
