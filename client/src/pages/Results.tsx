import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Award, Sparkles } from "lucide-react";

interface ResultData {
  name: string;
  organization?: string;
  manifestGifts: string[];
  latentGifts: string[];
}

export default function Results() {
  const [, setLocation] = useLocation();
  const [resultData, setResultData] = useState<ResultData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem("resultData");
    if (!storedData) {
      setLocation("/check-result");
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setResultData(data);
    } catch {
      setLocation("/check-result");
    }
  }, [setLocation]);

  if (!resultData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Resultado do Teste de Dons</CardTitle>
            <CardDescription className="text-lg">
              {resultData.name}
              {resultData.organization && ` • ${resultData.organization}`}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-blue-900">Dons Manifestos</CardTitle>
                <CardDescription>
                  Dons que você já demonstra com maior intensidade
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {resultData.manifestGifts.length > 0 ? (
              <ul className="space-y-3">
                {resultData.manifestGifts.map((gift, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="text-lg font-medium text-gray-900">{gift}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">Nenhum dom manifesto identificado nesta avaliação.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-green-900">Dons Latentes</CardTitle>
                <CardDescription>
                  Dons com potencial para serem desenvolvidos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {resultData.latentGifts.length > 0 ? (
              <ul className="space-y-3">
                {resultData.latentGifts.map((gift, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="text-lg font-medium text-gray-900">{gift}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">Nenhum dom latente identificado nesta avaliação.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-3 text-gray-900">
              Entenda seus resultados:
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong className="text-blue-700">Dons Manifestos</strong> são aqueles que você já
                demonstra com maior intensidade em sua vida e ministério. Eles representam suas
                forças atuais e áreas onde você naturalmente se destaca.
              </p>
              <p>
                <strong className="text-green-700">Dons Latentes</strong> são aqueles que possuem
                potencial para serem desenvolvidos e aprimorados. Com dedicação e prática, esses
                dons podem se tornar manifestos em sua vida.
              </p>
              <p className="text-sm text-gray-600 mt-4">
                Este resultado também foi enviado para o seu email. Que Deus continue abençoando sua
                jornada!
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setLocation("/")} className="flex-1">
            Voltar ao Início
          </Button>
          <Button
            onClick={() => window.print()}
            variant="secondary"
            className="flex-1"
          >
            Imprimir Resultado
          </Button>
        </div>
      </div>
    </div>
  );
}
