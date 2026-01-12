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

interface ContinueTestDialogProps {
  open: boolean;
  onContinue: () => void;
  onStartNew: () => void;
  testName: string;
  createdAt: Date;
}

export function ContinueTestDialog({
  open,
  onContinue,
  onStartNew,
  testName,
  createdAt,
}: ContinueTestDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Teste em Andamento Encontrado</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Encontramos um teste iniciado em{" "}
              <strong>{format(createdAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</strong>
            </p>
            <p className="text-base mt-2">
              Deseja continuar de onde parou ou iniciar um novo teste do zero?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onStartNew} className="w-full sm:w-auto">
            Começar Novo Teste
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            Continuar Teste Anterior
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
