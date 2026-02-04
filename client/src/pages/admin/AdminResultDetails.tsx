import { useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Download, Mail, Loader2, Edit2, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";

const formatDate = (date?: string | null) => {
  if (!date) return "--";
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

type AdminResultDetailsProps = {
  params?: {
    resultId?: string;
  };
};

export default function AdminResultDetails({ params }: AdminResultDetailsProps) {
  const [, setLocation] = useLocation();
  const printRef = useRef<HTMLDivElement | null>(null);

  // Estados para edição
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editOrganizationId, setEditOrganizationId] = useState<string>("");

  // --- pega ID da URL e converte para número ---
  const resultIdParam = params?.resultId ?? "";
  const resultId = Number(resultIdParam);

  const isInvalidId = Number.isNaN(resultId) || resultId <= 0;

  const utils = trpc.useUtils();

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

  // Buscar organizações para o select
  const organizationsQuery = trpc.adminOrganization.list.useQuery();
  const organizations = organizationsQuery.data ?? [];

  // Mutation para atualizar o resultado
  const updateMutation = trpc.adminResult.update.useMutation({
    onSuccess: async () => {
      await utils.adminResult.get.invalidate({ id: resultId });
      setIsEditDialogOpen(false);
    },
  });

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

  const openEditDialog = () => {
    setEditName(result.personName);
    setEditOrganizationId(result.organizationId ? String(result.organizationId) : "none");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({
      id: resultId,
      personName: editName,
      organizationId: editOrganizationId && editOrganizationId !== "none" ? Number(editOrganizationId) : null,
    });
  };

  const isCompleted = result.status === "completed";
  const isInProgress = result.status === "in_progress";
  const isAwaitingExternal = result.status === "awaiting_external";

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 md:px-0">
        {/* Barra superior: navegação + ações */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Button variant="ghost" className="gap-2 w-fit" asChild>
            <Link href="/admin/results">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={openEditDialog}>
              <Edit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            {isCompleted && (
              <Button variant="outline" className="gap-2" onClick={handleExportPdf}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </Button>
            )}
          </div>
        </div>

        {/* Área que será exportada para PDF */}
        <div ref={printRef} className="space-y-6">
          {/* Cabeçalho do resultado */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                  Resultado #{result.id}
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-1">
                  {result.personName}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {result.email}
                </div>
              </div>
              <StatusBadge status={result.status} />
            </div>

            {/* Informações básicas */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Organização</p>
                    <p className="text-sm font-medium">
                      {result.organizationName ?? "Não informada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Criado em</p>
                    <p className="text-sm font-medium">
                      {formatDate(result.createdAt)}
                    </p>
                  </div>
                  {isCompleted && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Finalizado em</p>
                      <p className="text-sm font-medium">
                        {formatDate(result.completedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status: Em Andamento */}
          {isInProgress && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-blue-900">Teste em Andamento</CardTitle>
                </div>
                <CardDescription>
                  O respondente ainda está preenchendo o teste. Os resultados estarão disponíveis após a conclusão.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-blue-800">
                    <strong>Próximos passos:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
                    <li>Aguardar o respondente finalizar o teste</li>
                    <li>Enviar lembrete caso necessário</li>
                    <li>Os resultados aparecerão automaticamente após conclusão</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status: Aguardando Avaliações Externas */}
          {isAwaitingExternal && (
            <>
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <CardTitle className="text-yellow-900">Aguardando Avaliações Externas</CardTitle>
                  </div>
                  <CardDescription>
                    O teste foi concluído pelo respondente, mas ainda faltam avaliações externas para gerar o resultado completo.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Avaliações externas */}
              <Card>
                <CardHeader>
                  <CardTitle>Status das Avaliações Externas</CardTitle>
                  <CardDescription>Acompanhe quem já respondeu e quem ainda está pendente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.externalAssessments?.map((assessment: any) => {
                    const isAssessmentCompleted = assessment.status === "completed";

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
                        className="flex flex-col gap-3 rounded-lg border p-4 bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{assessment.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {assessment.relation}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAssessmentCompleted ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <Badge variant="default" className="bg-green-600">Concluído</Badge>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                              </>
                            )}
                          </div>
                        </div>

                        {isAssessmentCompleted && assessment.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            Concluído em {formatDate(assessment.completedAt)}
                          </p>
                        )}

                        {!isAssessmentCompleted && (
                          <div className="mt-2 space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              Link para avaliação
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                className="text-xs flex-1"
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
                                Copiar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}

          {/* Status: Concluído - Mostrar resultados completos */}
          {isCompleted && (
            <>
              {/* Dons manifestos e latentes */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-900">Dons Manifestos</CardTitle>
                    <CardDescription>
                      Principais dons identificados pelo teste completo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {result.manifestGifts && result.manifestGifts.length > 0 ? (
                      result.manifestGifts.map((gift) => (
                        <div key={gift.name} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-900">{gift.name}</span>
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {gift.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${gift.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum dom manifesto identificado.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white">
                  <CardHeader>
                    <CardTitle className="text-2xl text-green-900">Dons Latentes</CardTitle>
                    <CardDescription>
                      Dons que podem ser estimulados e desenvolvidos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {result.latentGifts && result.latentGifts.length > 0 ? (
                      result.latentGifts.map((gift) => (
                        <div key={gift.name} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-900">{gift.name}</span>
                            <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                              {gift.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${gift.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum dom latente identificado.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Avaliações externas (se houver) */}
              {result.externalAssessments && result.externalAssessments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Avaliações Externas</CardTitle>
                    <CardDescription>Contribuições de pessoas próximas ao respondente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.externalAssessments.map((assessment: any) => {
                      const isAssessmentCompleted = assessment.status === "completed";

                      return (
                        <div
                          key={assessment.name}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4 bg-gray-50"
                        >
                          <div>
                            <p className="font-medium">{assessment.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {assessment.relation}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAssessmentCompleted ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <Badge variant="default" className="bg-green-600">Concluído</Badge>
                                {assessment.completedAt && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatDate(assessment.completedAt)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-gray-400" />
                                <Badge variant="outline">Não concluído</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Resultado</DialogTitle>
              <DialogDescription>
                Atualize as informações do respondente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-org">Organização</Label>
                <Select
                  value={editOrganizationId}
                  onValueChange={setEditOrganizationId}
                >
                  <SelectTrigger id="edit-org">
                    <SelectValue placeholder="Selecione uma organização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma organização</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={String(org.id)}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending || !editName.trim()}
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
