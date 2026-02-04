import { useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2 } from "lucide-react";
import { useConfetti } from "@/hooks/useConfetti";

interface ExternalCompletionDialogProps {
  open: boolean;
  assesseeName: string;
  onContinue: () => void;
}

export function ExternalCompletionDialog({ open, assesseeName, onContinue }: ExternalCompletionDialogProps) {
  const { celebrate } = useConfetti();

  // Disparar confetti quando o modal abrir
  useEffect(() => {
    if (open) {
      celebrate();
    }
  }, [open, celebrate]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            Parabéns! Avaliação Concluída
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-center">
            <p className="text-base">
              Você completou todas as 30 perguntas sobre {assesseeName}! 🎉
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-green-900 mb-2">Obrigado pela sua participação!</h4>
              <p className="text-sm text-green-800">
                Sua avaliação é muito importante para que {assesseeName} possa conhecer melhor seus dons espirituais.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Suas respostas foram salvas com sucesso.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onContinue}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Finalizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
