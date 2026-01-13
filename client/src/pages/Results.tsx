import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Award, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import giftsExplanations from "@shared/giftsExplanations.json";

interface GiftScore {
  gift: string;
  score: number;
}

interface ResultData {
  name: string;
  organization?: string;
  manifestGifts: string[];
  latentGifts: string[];
  manifestGiftScores?: GiftScore[];
  latentGiftScores?: GiftScore[];
}

export default function Results() {
  const [, setLocation] = useLocation();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [expandedGift, setExpandedGift] = useState<string | null>(null);

  const handleSaveAsPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

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

  const toggleGift = (giftName: string) => {
    setExpandedGift(expandedGift === giftName ? null : giftName);
  };

  const getGiftExplanation = (giftName: string) => {
    return giftsExplanations.find(g => g.name === giftName);
  };

  const calculatePercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100);
  };

  // Pontuação máxima: 3 perguntas * 4 pontos + 2 avaliadores * 4 pontos = 20 pontos
  const MAX_MANIFEST_SCORE = 20;
  // Pontuação máxima latente: 3 perguntas * 4 pontos = 12 pontos
  const MAX_LATENT_SCORE = 12;

  if (!resultData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 print:bg-white print:py-4 print:px-0">
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-4 print:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Resultado do Teste de Dons</CardTitle>
            <CardDescription className="text-lg">
              {resultData.name}
              {resultData.organization && ` • ${resultData.organization}`}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Dons Manifestos */}
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
              <div className="space-y-3">
                {resultData.manifestGifts.map((gift, index) => {
                  const scoreData = resultData.manifestGiftScores?.find(s => s.gift === gift);
                  const percentage = scoreData ? calculatePercentage(scoreData.score, MAX_MANIFEST_SCORE) : null;
                  const explanation = getGiftExplanation(gift);
                  const isExpanded = expandedGift === gift;

                  return (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-blue-100">
                      {/* Header do Dom */}
                      <div className="flex items-center gap-3 p-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-medium text-gray-900">{gift}</span>
                            {percentage !== null && (
                              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {percentage}%
                              </span>
                            )}
                          </div>
                          {percentage !== null && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGift(gift)}
                          className="flex-shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      {/* Descrição Expandida */}
                      {isExpanded && explanation && (
                        <div className="px-4 pb-4 pt-2 border-t border-blue-100 space-y-3 bg-blue-50/30">
                          <div>
                            <h5 className="font-semibold text-sm text-gray-700 mb-1">Definição:</h5>
                            <p className="text-sm text-gray-600">{explanation.definition}</p>
                          </div>
                          {explanation.tasks && (
                            <div>
                              <h5 className="font-semibold text-sm text-gray-700 mb-1">Como usar este dom:</h5>
                              <p className="text-sm text-gray-600">{explanation.tasks}</p>
                            </div>
                          )}
                          {explanation.tips && (
                            <div>
                              <h5 className="font-semibold text-sm text-gray-700 mb-1">Dicas práticas:</h5>
                              <p className="text-sm text-gray-600">{explanation.tips}</p>
                            </div>
                          )}
                          {explanation.dangers && (
                            <div>
                              <h5 className="font-semibold text-sm text-gray-700 mb-1">Cuidados:</h5>
                              <p className="text-sm text-gray-600">{explanation.dangers}</p>
                            </div>
                          )}
                          {explanation.references && (
                            <div>
                              <h5 className="font-semibold text-sm text-gray-700 mb-1">Referências bíblicas:</h5>
                              <p className="text-sm text-gray-600 italic">{explanation.references}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600">Nenhum dom manifesto identificado nesta avaliação.</p>
            )}
          </CardContent>
        </Card>

        {/* Dons Latentes */}
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
              <div className="space-y-3">
                {resultData.latentGifts.map((gift, index) => {
                  const scoreData = resultData.latentGiftScores?.find(s => s.gift === gift);
                  const percentage = scoreData ? calculatePercentage(scoreData.score, MAX_LATENT_SCORE) : null;
                  const explanation = getGiftExplanation(gift);
                  const isExpanded = expandedGift === gift;

                  return (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-green-100">
                      {/* Header do Dom */}
                      <div className="flex items-center gap-3 p-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-medium text-gray-900">{gift}</span>
                            {percentage !== null && (
                              <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                {percentage}%
                              </span>
                            )}
                          </div>
                          {percentage !== null && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGift(gift)}
                          className="flex-shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      {/* Descrição Expandida */}
                      {isExpanded && explanation && (
                        <div className="px-4 pb-4 pt-2 border-t border-green-100 space-y-3 bg-green-50/30">
                          <div>
                            <h5 className="font-semibold text-sm text-gray-700 mb-1">Definição:</h5>
                            <p className="text-sm text-gray-600">{explanation.definition}</p>
                          </div>
                          {explanation.tasks && (
                            <div>
                              <h5 className="font-semibold text-sm text-gray-700 mb-1">Como desenvolver este dom:</h5>
                              <p className="text-sm text-gray-600">{explanation.tasks}</p>
                            </div>
                          )}
                          {explanation.tips && (
                            <div>
                              <h5 className="font-semibold text-sm text-gray-700 mb-1">Dicas práticas:</h5>
                              <p className="text-sm text-gray-600">{explanation.tips}</p>
                            </div>
                          )}
                          {explanation.dangers && (
                            <div>
                              <h5 className="font-semibold text-sm text-gray-700 mb-1">Cuidados:</h5>
                              <p className="text-sm text-gray-600">{explanation.dangers}</p>
                            </div>
                          )}
                          {explanation.references && (
                            <div>
                              <h5 className="font-semibold text-sm text-gray-700 mb-1">Referências bíblicas:</h5>
                              <p className="text-sm text-gray-600 italic">{explanation.references}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600">Nenhum dom latente identificado nesta avaliação.</p>
            )}
          </CardContent>
        </Card>

        {/* Explicação */}
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
              <p>
                <strong className="text-purple-700">Porcentagens:</strong> indicam a intensidade de cada dom 
                com base nas suas respostas e nas avaliações externas. Quanto maior a porcentagem, 
                mais evidente é esse dom em sua vida.
              </p>
              <p className="text-sm text-gray-600 mt-4">
                💡 <strong>Dica:</strong> Clique em cada dom para ver sua descrição completa, 
                dicas práticas e referências bíblicas.
              </p>
              <p className="text-sm text-gray-600">
                Este resultado também foi enviado para o seu email. Que Deus continue abençoando sua
                jornada!
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 print:hidden md:flex-row">
          <Button variant="outline" onClick={() => setLocation("/check-result")} className="flex-1">
            Voltar para a Lista
          </Button>
          <Button
            onClick={handleSaveAsPdf}
            variant="secondary"
            className="flex-1"
          >
            Salvar em PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
