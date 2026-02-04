import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface ShareLinksTutorialModalProps {
  open: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export function ShareLinksTutorialModal({
  open,
  onClose,
}: ShareLinksTutorialModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    onClose(dontShowAgain);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">
            🎉 Teste Concluído com Sucesso!
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-base">
            <p>
              Próximo passo: Compartilhar avaliações externas com{" "}
              <strong>2 pessoas que te conhecem bem</strong>.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-blue-900 font-semibold">
                💡 Dica Importante
              </p>
              <p className="text-sm text-blue-800">
                Não se preocupe em perder os links!
              </p>
              <p className="text-sm text-blue-800">
                Você pode acessá-los novamente a qualquer momento em:
              </p>
              <div className="bg-white rounded-md p-3 border border-blue-200">
                <p className="text-sm text-blue-900 font-medium">
                  Menu → <strong>Consultar Resultados</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="dontShowAgain"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <label
                htmlFor="dontShowAgain"
                className="text-sm text-gray-600 cursor-pointer leading-tight"
              >
                Não mostrar novamente
              </label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleClose}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Entendi, Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
