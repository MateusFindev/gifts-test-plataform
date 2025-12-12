import { useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, Mail, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { trpc } from "@/lib/trpc";

const formatDate = (date?: string | null) => {
  if (!date) return "--";
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

// pontuação máxima teórica dos dons (ajuste/congele ou remova depois se não for usar)
const MANIFEST_MAX_SCORE = 20;
const LATENT_MAX_SCORE = 12;

const getPercentage = (score: number, maxScore: number) => {
  if (!maxScore) return 0;
  const raw = Math.round((score / maxScore) * 100);
  return Math.max(0, Math.min(100, raw));
};

const statusLabels: Record<string, string> = {
  completed: "Concluído",
  awaiting_external: "Aguardando avaliações externas",
  in_progress: "Em andamento",
  draft: "Rascunho",
};

type AdminResultDetailsProps = {
  params?: {
    resultId?: string;
  };
};

export default function AdminResultDetails({ params }: AdminResultDetailsProps) {
  const [, setLocation] = useLocation();
  const printRef = useRef<HTMLDivElement | null>(null);

  // --- pega ID da URL e converte para número ---
  const resultIdParam = params?.resultId ?? "";
  const resultId = Number(resultIdParam);

  const isInvalidId = Number.isNaN(resultId) || resultId <= 0;

  // --- busca o resultado na API ---
  const {
    data: result,
    isLoading,
    isError,
    error,
  } = trpc.adminResult.get.useQuery(
    { id: resultId },
    {
      enabled: !isInvalidId,
    },
  );

  // ID inválido de cara
  if (isInvalidId) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <CardTitle>Resultado não encontrado</CardTitle>
              <CardDescription>
                O identificador informado não é válido. Retorne para a lista e
                tente novamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/admin/results")}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // carregando
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando resultado...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // erro da API
  if (isError) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <CardTitle>Erro ao carregar resultado</CardTitle>
              <CardDescription>
                {error?.message ?? "Ocorreu um erro inesperado."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/admin/results")}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // não veio nada da API
  if (!result) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <CardTitle>Resultado não encontrado</CardTitle>
              <CardDescription>
                O identificador informado não existe ou foi removido. Retorne
                para a lista e tente novamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/admin/results")}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleExportPdf = () => {
    if (typeof window === "undefined" || !printRef.current) return;

    const contentHtml = printRef.current.innerHTML;

    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) return;

    const doc = printWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charSet="utf-8" />
          <title>Resultado ${result.personName}</title>
          ${document.head.innerHTML}
          <style>
            body {
              padding: 2rem;
              background: white;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `);
    doc.close();

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Barra superior: navegação + ações (não vai pro PDF) */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Button variant="ghost" className="gap-2 w-fit" asChild>
            <Link href="/admin/results">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportPdf}>
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Área que será exportada para PDF */}
        <div ref={printRef} className="space-y-6">
          {/* Cabeçalho do resultado */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Resultado #{result.id}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {result.personName}
                </h1>
                <p className="text-sm text-muted-foreground">{result.email}</p>
              </div>
              <Badge variant="secondary">
                {statusLabels[result.status] ?? result.status}
              </Badge>
            </div>
          </div>

          {/* Resumo + contato */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Resumo geral</CardTitle>
                <CardDescription>
                  Informações consolidadas do respondente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Organização
                    </p>
                    <p className="text-lg font-semibold">
                      {result.organizationName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="text-lg font-semibold">
                      {formatDate(result.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Finalizado em
                    </p>
                    <p className="text-lg font-semibold">
                      {formatDate(result.completedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contato e acompanhamento</CardTitle>
                <CardDescription>
                  Informe ao respondente o próximo passo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {result.email}
                </div>
                <Button className="w-full" disabled>
                  Enviar lembrete
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Dons manifestos e latentes lado a lado */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dons manifestos</CardTitle>
                <CardDescription>
                  Principais dons identificados pelo teste completo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.manifestGifts.map((gift) => (
                  <div key={gift.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{gift.name}</span>
                      {/* só o percentual, sem “X / 20” */}
                      <span className="text-xs text-muted-foreground">
                        {gift.percentage}%
                      </span>
                    </div>
                    <Progress value={gift.percentage} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dons latentes</CardTitle>
                <CardDescription>
                  Dons que podem ser estimulados e desenvolvidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.latentGifts.map((gift) => (
                  <div key={gift.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{gift.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {gift.percentage}%
                      </span>
                    </div>
                    <Progress value={gift.percentage} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Avaliações externas */}
          <Card>
            <CardHeader>
              <CardTitle>Avaliações externas</CardTitle>
              <CardDescription>Status dos convidados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.externalAssessments?.map((assessment: any) => {
                const isCompleted = assessment.status === "completed";

                const tokenPlaceholder = encodeURIComponent(
                  `${result.id}-${assessment.name}`.replace(/\s+/g, "-").toLowerCase()
                );
                const relativeLink = `/external/${tokenPlaceholder}`;
                const fullUrl =
                  typeof window !== "undefined"
                    ? `${window.location.origin}${relativeLink}`
                    : relativeLink;

                return (
                  <div
                    key={assessment.name}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">{assessment.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {assessment.relation}
                      </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
                      <div className="flex items-center gap-2">
                        <Badge variant={isCompleted ? "default" : "outline"}>
                          {isCompleted ? "Concluído" : "Pendente"}
                        </Badge>
                        {assessment.completedAt && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(assessment.completedAt)}
                          </span>
                        )}
                      </div>

                      {!isCompleted && (
                        <div className="mt-1 space-y-2 w-full md:w-auto">
                          <p className="text-xs text-muted-foreground">
                            Link para avaliação
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <input
                              className="flex-1 text-xs border rounded px-2 py-1 bg-muted"
                              readOnly
                              value={fullUrl}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (navigator.clipboard?.writeText) {
                                  navigator.clipboard.writeText(fullUrl);
                                }
                              }}
                            >
                              Copiar link
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-0 text-xs"
                            onClick={() => {
                              console.log(
                                "Gerar novo link de avaliação externa para",
                                assessment.name
                              );
                            }}
                          >
                            Gerar novo link
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
