import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@/lib/payment-utils";
import { format } from "date-fns";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  showAmount?: boolean;
}

export function PaymentStatusBadge({
  status,
  showAmount = false,
}: PaymentStatusBadgeProps) {
  if (status.isPaid) {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Paid
        {showAmount && ` ($${status.amountPaid})`}
      </Badge>
    );
  }

  if (status.status === "PARTIAL") {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 gap-1">
        <Clock className="w-3 h-3" />
        Partial
        {showAmount && ` ($${status.amountPaid})`}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-red-50 text-red-600 border-red-200 gap-1"
    >
      <AlertCircle className="w-3 h-3" />
      Unpaid
    </Badge>
  );
}
