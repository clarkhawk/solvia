import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, "default" | "destructive" | "success" | "warning" | "secondary"> = {
  upcoming: "secondary",
  overdue: "destructive",
  paid: "success",
  partially_paid: "warning",
  cancelled: "outline" as "secondary",
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: "À venir",
  overdue: "En retard",
  paid: "Payée",
  partially_paid: "Partielle",
  cancelled: "Annulée",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? "default"}>{STATUS_LABELS[status] ?? status}</Badge>;
}
