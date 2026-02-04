import { Badge } from "@/components/ui/badge";
import { getStatusConfig } from "@/lib/status-config";

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1.5 pl-2 ${className ?? ""}`}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </Badge>
  );
}
