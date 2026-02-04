import { CheckCircle, Clock, Pencil, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ResultStatus = "completed" | "awaiting_external" | "in_progress" | "draft";

export interface StatusConfig {
  label: string;
  icon: LucideIcon;
  variant: "default" | "secondary" | "outline" | "destructive";
  color: string;
}

export const STATUS_CONFIG: Record<ResultStatus, StatusConfig> = {
  completed: {
    label: "Finalizado",
    icon: CheckCircle,
    variant: "default",
    color: "bg-green-500",
  },
  awaiting_external: {
    label: "Aguardando Respostas",
    icon: Clock,
    variant: "secondary",
    color: "bg-yellow-500",
  },
  in_progress: {
    label: "Em Andamento",
    icon: Pencil,
    variant: "outline",
    color: "bg-blue-500",
  },
  draft: {
    label: "Rascunho",
    icon: FileText,
    variant: "outline",
    color: "bg-gray-500",
  },
};

export const getStatusConfig = (status: string): StatusConfig => {
  return STATUS_CONFIG[status as ResultStatus] ?? STATUS_CONFIG.draft;
};
