import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Calendar, CheckCircle2, Clock, AlertCircle, Copy, Check, ExternalLink } from "lucide-react";

export default function CheckResult() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const { data: tests, isLoading, error } = trpc.giftTest.getAllResultsByEmail.useQuery(
    { email: searchEmail },
    { enabled: searchEmail.length > 0 }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Por favor, digite um email");
      return;
    }

    setSearchEmail(email.trim());
  };

  const handleViewResult = (testData: any) => {
    if (testData.status !== "completed") {
      toast.info(
        testData.status === "in_progress"
          ? "Teste ainda não foi finalizado"
          : "Aguardando avaliações externas"
      );
      return;
    }

    sessionStorage.setItem("resultData", JSON.stringify(testData));
    setLocation("/results");
  };

  const handleContinueTest = (testData: any) => {
    // Salvar informações no sessionStorage
    sessionStorage.setItem("currentTestId", testData.id.toString());
    sessionStorage.setItem("testMaritalStatus", testData.maritalStatus || "single");
    sessionStorage.setItem("testOrganization", testData.organization || "");

    // Salvar respostas no localStorage
    const storageKey = `giftTest_${testData.id}_answers`;
    const answersToSave = Array.isArray(testData.selfAnswers) && testData.selfAnswers.length === 180
      ? testData.selfAnswers
      : new Array(180).fill(-1);
    
    localStorage.setItem(storageKey, JSON.stringify(answersToSave));

    // Calcular primeira pergunta não respondida
    const firstUnansweredIndex = answersToSave.findIndex((answer: number) => answer === -1);
    const targetIndex = firstUnansweredIndex !== -1 ? firstUnansweredIndex : 0;
    
    sessionStorage.setItem("continueFromQuestion", targetIndex.toString());

    toast.success("Continuando teste...");
    setLocation("/test/questions");
  };

  const copyToClipboard = (text: string, linkId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLink(linkId);
      toast.success("Link copiado!");
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const shareOnWhatsApp = (link: string, evaluatorNumber: number) => {
    const message = `Olá! 👋\n\nVocê pode me ajudar respondendo esta avaliação sobre mim? São apenas 30 perguntas rápidas e vai me ajudar muito!\n\n${link}\n\nObrigado pela ajuda! 🙏`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Concluído
          </span>
        );
      case "awaiting_external":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3" />
            Aguardando Avaliações
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <AlertCircle className="h-3 w-3" />
            Em Andamento
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExternalLink = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/external/${token}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Consultar Resultados</CardTitle>
            <CardDescription className="text-base">
              Digite o email usado no teste para visualizar todos os seus resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      "Consultar"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700 text-center">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {tests && tests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {tests.length} {tests.length === 1 ? "teste encontrado" : "testes encontrados"}
            </h2>

            {tests.map((test: any) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{test.name}</CardTitle>
                      {test.organization && (
                        <CardDescription>{test.organization}</CardDescription>
                      )}
                    </div>
                    {getStatusBadge(test.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Realizado em {formatDate(test.createdAt)}</span>
                  </div>

                  {/* Status: EM ANDAMENTO */}
                  {test.status === "in_progress" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-1">Teste Incompleto</h4>
                          <p className="text-sm text-blue-700">
                            Você começou este teste mas ainda não finalizou todas as perguntas. 
                            Clique no botão abaixo para continuar de onde parou.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleContinueTest(test)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Continuar Teste
                      </Button>
                    </div>
                  )}

                  {/* Status: AGUARDANDO AVALIAÇÕES */}
                  {test.status === "awaiting_external" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-900 mb-1">Aguardando Avaliações Externas</h4>
                          <p className="text-sm text-yellow-700 mb-3">
                            Você completou sua autoavaliação! Agora compartilhe os links abaixo com 2 pessoas que te conhecem bem para completar o teste.
                          </p>
                        </div>
                      </div>

                      {/* Link 1 */}
                      {test.externalToken1 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            📋 Link para Avaliador 1:
                          </Label>
                          {test.externalCompleted1 ? (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-green-700">Avaliação respondida</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <Input
                                  value={getExternalLink(test.externalToken1)}
                                  readOnly
                                  onClick={(e) => e.currentTarget.select()}
                                  className="font-mono text-sm"
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => copyToClipboard(getExternalLink(test.externalToken1), `link1-${test.id}`)}
                                  className="flex-shrink-0"
                                >
                                  {copiedLink === `link1-${test.id}` ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  className="flex-shrink-0 bg-green-600 hover:bg-green-700"
                                  onClick={() => shareOnWhatsApp(getExternalLink(test.externalToken1), 1)}
                                >
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Link 2 */}
                      {test.externalToken2 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            📋 Link para Avaliador 2:
                          </Label>
                          {test.externalCompleted2 ? (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-green-700">Avaliação respondida</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                <Input
                                  value={getExternalLink(test.externalToken2)}
                                  readOnly
                                  onClick={(e) => e.currentTarget.select()}
                                  className="font-mono text-sm"
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => copyToClipboard(getExternalLink(test.externalToken2), `link2-${test.id}`)}
                                  className="flex-shrink-0"
                                >
                                  {copiedLink === `link2-${test.id}` ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  className="flex-shrink-0 bg-green-600 hover:bg-green-700"
                                  onClick={() => shareOnWhatsApp(getExternalLink(test.externalToken2), 2)}
                                >
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-yellow-600 mt-2">
                        💡 <strong>Dica:</strong> Escolha pessoas que te conhecem bem e podem dar uma avaliação honesta sobre você.
                      </p>
                    </div>
                  )}

                  {/* Status: CONCLUÍDO */}
                  {test.status === "completed" && test.manifestGifts && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-gray-900">Prévia dos Resultados:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium text-purple-700">Dons Manifestos:</p>
                          <p className="text-gray-700">{test.manifestGifts.join(", ")}</p>
                        </div>
                        <div>
                          <p className="font-medium text-pink-700">Dons Latentes:</p>
                          <p className="text-gray-700">{test.latentGifts?.join(", ") || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleViewResult(test)}
                    disabled={test.status !== "completed"}
                    className="w-full"
                  >
                    {test.status === "completed" ? "Ver Resultado Completo" : "Resultado Indisponível"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Voltar para Início
          </Button>
        </div>
      </div>
    </div>
  );
}
