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

interface CompletionDialogProps {
  open: boolean;
  onContinue: () => void;
}

export function CompletionDialog({ open, onContinue }: CompletionDialogProps) {
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
            Parabéns! Autoavaliação Concluída
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-center">
            <p className="text-base">
              Você completou todas as 180 perguntas de autoavaliação! 🎉
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-blue-900 mb-2">Próxima Etapa:</h4>
              <p className="text-sm text-blue-800">
                Para obter seu resultado completo, você precisará compartilhar o teste com{" "}
                <strong>2 pessoas que te conhecem bem</strong>. Elas responderão 30 perguntas sobre você.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Na próxima tela, você receberá os links para compartilhar com essas pessoas.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onContinue}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Continuar para Compartilhamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
