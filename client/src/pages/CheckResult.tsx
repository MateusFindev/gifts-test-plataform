import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function CheckResult() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

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
