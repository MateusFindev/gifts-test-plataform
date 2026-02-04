import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AwaitingExternalDialogProps {
  open: boolean;
  onViewProgress: () => void;
  onStartNew: () => void;
  testName: string;
  createdAt: Date;
  externalCompleted1: boolean;
  externalCompleted2: boolean;
  otherAwaitingCount?: number;
}

export function AwaitingExternalDialog({
  open,
  onViewProgress,
  onStartNew,
  testName,
  createdAt,
  externalCompleted1,
  externalCompleted2,
  otherAwaitingCount = 0,
}: AwaitingExternalDialogProps) {
  const completedCount = (externalCompleted1 ? 1 : 0) + (externalCompleted2 ? 1 : 0);
  const pendingCount = 2 - completedCount;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Teste Aguardando Avaliações Externas</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Encontramos um teste criado em{" "}
              <strong>{format(createdAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                📊 <strong>Status das avaliações:</strong>
              </p>
              <p className="text-sm text-blue-800 mt-1">
                ✅ {completedCount} de 2 avaliações concluídas
              </p>
              {pendingCount > 0 && (
                <p className="text-sm text-blue-800">
                  ⏳ {pendingCount} avaliação{pendingCount > 1 ? "ões" : ""} pendente{pendingCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <p className="text-base mt-3">
              Deseja visualizar o progresso deste teste ou iniciar um novo?
            </p>
            {otherAwaitingCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-blue-900">
                  📊 Você também tem <strong>{otherAwaitingCount}</strong> outro{otherAwaitingCount > 1 ? "s" : ""} teste{otherAwaitingCount > 1 ? "s" : ""} aguardando avaliações.
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  Este é o mais recente. Acesse "Consultar Resultados" para ver todos.
                </p>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
              <p className="text-xs text-amber-900">
                ⚠️ <strong>Importante:</strong> Ao iniciar um novo teste, o teste anterior{" "}
                <strong>não será excluído</strong>. Você poderá acessá-lo posteriormente.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onStartNew} className="w-full sm:w-auto">
            Iniciar Novo Teste
          </AlertDialogCancel>
          <AlertDialogAction onClick={onViewProgress} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            Visualizar Progresso
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
