import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Copy, Check, Mail, MessageCircle } from "lucide-react";

export default function ExternalLinks() {
  const [, setLocation] = useLocation();
  const [token1, setToken1] = useState("");
  const [token2, setToken2] = useState("");
  const [copied1, setCopied1] = useState(false);
  const [copied2, setCopied2] = useState(false);

  useEffect(() => {
    const t1 = sessionStorage.getItem("externalToken1");
    const t2 = sessionStorage.getItem("externalToken2");

    if (!t1 || !t2) {
      toast.error("Tokens não encontrados. Redirecionando...");
      setLocation("/");
      return;
    }

    setToken1(t1);
    setToken2(t2);
  }, [setLocation]);

  const getFullUrl = (token: string) => {
    return `${window.location.origin}/external/${token}`;
  };

  const copyToClipboard = (token: string, linkNumber: number) => {
    navigator.clipboard.writeText(getFullUrl(token));
    if (linkNumber === 1) {
      setCopied1(true);
      setTimeout(() => setCopied1(false), 2000);
    } else {
      setCopied2(true);
      setTimeout(() => setCopied2(false), 2000);
    }
    toast.success(`Link ${linkNumber} copiado para a área de transferência!`);
  };

  const shareOnWhatsApp = (token: string, linkNumber: number) => {
    const url = getFullUrl(token);
    const message = encodeURIComponent(
      `Olá! 👋\n\nVocê pode me ajudar respondendo esta avaliação sobre mim? São apenas 30 perguntas rápidas e vai me ajudar muito!\n\n${url}\n\nObrigado pela ajuda! 🙏`
    );
    const whatsappUrl = `https://api.whatsapp.com/send?text=${message}`;
    window.open(whatsappUrl, "_blank");
    toast.success(`Abrindo WhatsApp para compartilhar o Link ${linkNumber}...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl">Avaliação Externa</CardTitle>
          <CardDescription className="text-base">
            Compartilhe os links abaixo com duas pessoas que te conhecem bem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Importante:</strong> Escolha pessoas que te conhecem há bastante tempo e podem
              avaliar objetivamente suas características e comportamentos. Cada pessoa responderá 30
              perguntas sobre você.
            </p>
          </div>

          {/* Link 1 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Link para a Primeira Pessoa</h3>
            <div className="flex gap-2">
              <Input 
                value={getFullUrl(token1)} 
                readOnly 
                className="flex-1 text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(token1, 1)}
                title="Copiar link"
                className="flex-shrink-0"
              >
                {copied1 ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => copyToClipboard(token1, 1)}
                variant="outline"
                className="flex-1 h-12 text-base"
              >
                <Copy className="mr-2 h-5 w-5" />
                Copiar Link 1
              </Button>
              <Button
                onClick={() => shareOnWhatsApp(token1, 1)}
                className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Enviar no WhatsApp
              </Button>
            </div>
          </div>

          {/* Separador visual */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">E</span>
            </div>
          </div>

          {/* Link 2 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Link para a Segunda Pessoa</h3>
            <div className="flex gap-2">
              <Input 
                value={getFullUrl(token2)} 
                readOnly 
                className="flex-1 text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(token2, 2)}
                title="Copiar link"
                className="flex-shrink-0"
              >
                {copied2 ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => copyToClipboard(token2, 2)}
                variant="outline"
                className="flex-1 h-12 text-base"
              >
                <Copy className="mr-2 h-5 w-5" />
                Copiar Link 2
              </Button>
              <Button
                onClick={() => shareOnWhatsApp(token2, 2)}
                className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Enviar no WhatsApp
              </Button>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Próximos passos:</h4>
                <ol className="text-sm text-green-800 space-y-1.5">
                  <li><strong>1.</strong> Envie cada link para uma pessoa diferente (use os botões acima)</li>
                  <li><strong>2.</strong> Aguarde as duas pessoas responderem as 30 perguntas</li>
                  <li><strong>3.</strong> Você receberá o resultado por email automaticamente</li>
                  <li><strong>4.</strong> Também poderá consultar o resultado a qualquer momento usando seu email</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>💡 Dica:</strong> Escolha pessoas próximas como familiares, amigos de longa data, 
              líderes espirituais ou colegas que convivem com você regularmente. Quanto melhor te conhecerem, 
              mais preciso será o resultado!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" onClick={() => setLocation("/")} className="flex-1 h-12">
              Voltar ao Início
            </Button>
            <Button onClick={() => setLocation("/check-result")} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700">
              Consultar Resultado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
