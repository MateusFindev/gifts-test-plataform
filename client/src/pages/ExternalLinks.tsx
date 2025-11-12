import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Copy, Check, Mail } from "lucide-react";

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
    toast.success(`Link ${linkNumber} copiado!`);
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

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Link para a Primeira Pessoa</h3>
              <div className="flex gap-2">
                <Input value={getFullUrl(token1)} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(token1, 1)}
                >
                  {copied1 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Link para a Segunda Pessoa</h3>
              <div className="flex gap-2">
                <Input value={getFullUrl(token2)} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(token2, 2)}
                >
                  {copied2 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Próximos passos:</h4>
                <ol className="text-sm text-green-800 space-y-1">
                  <li>1. Envie cada link para uma pessoa diferente</li>
                  <li>2. Aguarde as duas pessoas responderem</li>
                  <li>3. Você receberá o resultado por email automaticamente</li>
                  <li>4. Também poderá consultar o resultado usando seu email</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation("/")} className="flex-1">
              Voltar ao Início
            </Button>
            <Button onClick={() => setLocation("/check-result")} className="flex-1">
              Consultar Resultado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
