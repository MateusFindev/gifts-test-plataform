import { X } from "lucide-react";
import { useState } from "react";

interface ShareLinksInfoBannerProps {
  onClose?: () => void;
}

export function ShareLinksInfoBanner({ onClose }: ShareLinksInfoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative">
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 transition-colors"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="pr-8">
        <p className="text-sm text-blue-900 font-medium mb-1">
          💡 Dica
        </p>
        <p className="text-sm text-blue-800">
          Você pode acessar estes links novamente em{" "}
          <strong>"Consultar Resultados"</strong> usando seu email.
        </p>
      </div>
    </div>
  );
}
