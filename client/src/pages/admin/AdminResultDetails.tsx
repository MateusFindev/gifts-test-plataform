import { useRef, useState, useMemo } from "react";
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
import { ArrowLeft, Download, Mail, Loader2, Edit2, Clock, AlertCircle, CheckCircle2, BarChart3, FileDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/_core/hooks/useAuth";

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
  const { user } = useAuth();

  // Estados para edição
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editOrganizationId, setEditOrganizationId] = useState<string>("");
  
  // Estado para modal de pontuação completa
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  // Buscar organizações do usuário (SUPER_ADMIN vê todas, ORG_ADMIN vê apenas as suas)
  const myOrgsQuery = trpc.auth.myOrganizations.useQuery();
  const userOrganizations = myOrgsQuery.data ?? [];
  
  const organizationsQuery = trpc.adminOrganization.list.useQuery(
    undefined,
    { enabled: user?.role === "SUPER_ADMIN" }
  );
  
  // Usar organizações do usuário (SUPER_ADMIN vê todas, ORG_ADMIN vê apenas as suas)
  const organizations = useMemo(
    () => user?.role === "SUPER_ADMIN" ? (organizationsQuery.data ?? []) : userOrganizations,
    [user?.role, organizationsQuery.data, userOrganizations]
  );

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
              <Button onClick={() => {
                const returnTo = sessionStorage.getItem('returnTo') ?? '/admin/results';
                sessionStorage.removeItem('returnTo');
                setLocation(returnTo);
              }}>
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
              <Button onClick={() => {
                const returnTo = sessionStorage.getItem('returnTo') ?? '/admin/results';
                sessionStorage.removeItem('returnTo');
                setLocation(returnTo);
              }}>
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
              <Button onClick={() => {
                const returnTo = sessionStorage.getItem('returnTo') ?? '/admin/results';
                sessionStorage.removeItem('returnTo');
                setLocation(returnTo);
              }}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleExportPdf = () => {
    if (typeof window === "undefined" || isExportingPdf) return;

    setIsExportingPdf(true);

    try {
      const fileName = `resultado-${result.personName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;

      // ==== CABEÇALHO ====
      pdf.setFontSize(20);
      pdf.setTextColor(29, 78, 216); // blue-600
      pdf.text('Resultado do Teste de Dons Espirituais', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // ==== INFORMAÇÕES DO TESTE ====
      pdf.setFontSize(10);
      pdf.setTextColor(75, 85, 99); // gray-600
      pdf.text(`Resultado #${result.id}`, 14, yPos);
      yPos += 6;
      
      pdf.setFontSize(14);
      pdf.setTextColor(17, 24, 39); // gray-900
      pdf.text(result.personName, 14, yPos);
      yPos += 6;
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // gray-500
      pdf.text(result.email, 14, yPos);
      yPos += 10;

      // Tabela de informações
      const infoData = [
        ['Organização', result.organizationName ?? 'Não informada'],
        ['Criado em', formatDate(result.createdAt)],
        ['Finalizado em', formatDate(result.completedAt)],
        ['Status', getStatusLabel(result.status)]
      ];

      autoTable(pdf, {
        startY: yPos,
        head: [['Informação', 'Valor']],
        body: infoData,
        theme: 'grid',
        headStyles: {
          fillColor: [241, 245, 249], // gray-100
          textColor: [30, 41, 59], // gray-800
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [55, 65, 81] // gray-700
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (pdf as any).lastAutoTable.finalY + 15;

      // ==== DONS MANIFESTOS ====
      pdf.setFontSize(14);
      pdf.setTextColor(37, 99, 235); // blue-600
      pdf.text('Dons Manifestos', 14, yPos);
      yPos += 6;

      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Principais dons identificados pelo teste completo', 14, yPos);
      yPos += 10;

      const manifestData = result.manifestGifts.map((gift: any, index: number) => [
        (index + 1).toString(),
        gift.name,
        `${gift.percentage}%`,
        `${gift.score}/20`
      ]);

      autoTable(pdf, {
        startY: yPos,
        head: [['#', 'Dom', 'Percentual', 'Pontuação']],
        body: manifestData,
        theme: 'striped',
        headStyles: {
          fillColor: [37, 99, 235], // blue-600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [239, 246, 255] // blue-50
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 90 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (pdf as any).lastAutoTable.finalY + 15;

      // Verificar se precisa de nova página
      if (yPos > 240) {
        pdf.addPage();
        yPos = 20;
      }

      // ==== DONS LATENTES ====
      pdf.setFontSize(14);
      pdf.setTextColor(22, 163, 74); // green-600
      pdf.text('Dons Latentes', 14, yPos);
      yPos += 6;

      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Dons que podem ser estimulados e desenvolvidos', 14, yPos);
      yPos += 10;

      const latentData = result.latentGifts.map((gift: any, index: number) => [
        (index + 1).toString(),
        gift.name,
        `${gift.percentage}%`,
        `${gift.score}/12`
      ]);

      autoTable(pdf, {
        startY: yPos,
        head: [['#', 'Dom', 'Percentual', 'Pontuação']],
        body: latentData,
        theme: 'striped',
        headStyles: {
          fillColor: [22, 163, 74], // green-600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [240, 253, 244] // green-50
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 90 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
      });

      // Avaliações externas removidas do PDF

      // Rodapé
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175); // gray-400
        pdf.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        pdf.text(
          'Teste de Dons Espirituais',
          14,
          pdf.internal.pageSize.getHeight() - 10
        );
        pdf.text(
          formatDate(new Date().toISOString()),
          pageWidth - 14,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar PDF. Por favor, tente novamente.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'completed': 'Finalizado',
      'in_progress': 'Em Andamento',
      'awaiting_external': 'Aguardando Avaliações',
      'draft': 'Rascunho'
    };
    return labels[status] || status;
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
        <div className="flex flex-row items-center justify-between gap-2">
          <Button 
            variant="ghost" 
            className="gap-2 w-fit"
            onClick={() => {
              const returnTo = sessionStorage.getItem('returnTo') ?? '/admin/results';
              sessionStorage.removeItem('returnTo');
              setLocation(returnTo);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={openEditDialog}>
              <Edit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            {isCompleted && (
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={handleExportPdf}
                disabled={isExportingPdf}
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Gerando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar PDF</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Área que será exportada para PDF */}
        <div ref={printRef} className="space-y-6">
          {/* Cabeçalho do resultado */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-start justify-between gap-4">
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
              <CardHeader>
                <CardTitle className="text-xl">Informações sobre o Teste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Organização</p>
                    <p className="text-base font-medium">
                      {result.organizationName ?? "Não informada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Criado em</p>
                    <p className="text-base font-medium">
                      {formatDate(result.createdAt)}
                    </p>
                  </div>
                  {isCompleted && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Finalizado em</p>
                      <p className="text-base font-medium">
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
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl text-blue-900">Dons Manifestos</CardTitle>
                        <CardDescription>
                          Principais dons identificados pelo teste completo
                        </CardDescription>
                      </div>
                      {user?.role === "SUPER_ADMIN" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                          onClick={() => setIsScoreModalOpen(true)}
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span className="hidden sm:inline">Ver pontuação completa</span>
                        </Button>
                      )}
                    </div>
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
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl text-green-900">Dons Latentes</CardTitle>
                        <CardDescription>
                          Dons que podem ser estimulados e desenvolvidos
                        </CardDescription>
                      </div>
                      {user?.role === "SUPER_ADMIN" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-green-700 hover:text-green-900 hover:bg-green-100"
                          onClick={() => setIsScoreModalOpen(true)}
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span className="hidden sm:inline">Ver pontuação completa</span>
                        </Button>
                      )}
                    </div>
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
                    <CardTitle className="text-xl">Avaliações Externas</CardTitle>
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
                  <SelectTrigger id="edit-org" className="w-full">
                    <SelectValue placeholder="Selecione uma organização" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ORG_ADMIN não pode deixar sem organização */}
                    {user?.role === "SUPER_ADMIN" && (
                      <SelectItem value="none">Nenhuma organização</SelectItem>
                    )}
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

        {/* Modal de Pontuação Completa */}
        <Dialog open={isScoreModalOpen} onOpenChange={setIsScoreModalOpen}>
          <DialogContent 
            className="!max-w-none h-[90vh] p-0 gap-0"
            style={{ width: 'min(95vw, 1600px)' }}
          >
            {/* Header fixo */}
            <div className="px-6 py-4 border-b bg-white rounded-t-lg">
              <DialogTitle className="text-xl md:text-2xl font-bold mb-2">
                Pontuação Completa dos Dons
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Ranking completo de todos os dons avaliados, ordenados por pontuação
              </DialogDescription>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
                {/* Dons Manifestos */}
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-200">
                    <div className="h-5 w-5 rounded-full bg-blue-600"></div>
                    <h3 className="text-lg md:text-xl font-bold text-blue-900">
                      Dons Manifestos
                    </h3>
                    <span className="text-xs md:text-sm text-muted-foreground ml-auto">
                      (Máx: 20 pontos)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {result.allManifestScores && result.allManifestScores.length > 0 ? (
                      result.allManifestScores.map((gift, index) => (
                        <div
                          key={gift.name}
                          className="flex items-center gap-4 p-4 rounded-lg border border-blue-200 bg-blue-50/30 hover:bg-blue-50 transition-colors"
                        >
                          <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="flex-1 font-medium text-gray-900 text-base">
                            {gift.name}
                          </span>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full min-w-[65px] text-center">
                              {gift.percentage}%
                            </span>
                            <span className="text-sm text-gray-600 font-medium min-w-[55px] text-right">
                              {gift.score}/20
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                    )}
                  </div>
                </div>

                {/* Dons Latentes */}
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-green-200">
                    <div className="h-5 w-5 rounded-full bg-green-600"></div>
                    <h3 className="text-lg md:text-xl font-bold text-green-900">
                      Dons Latentes
                    </h3>
                    <span className="text-xs md:text-sm text-muted-foreground ml-auto">
                      (Máx: 12 pontos)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {result.allLatentScores && result.allLatentScores.length > 0 ? (
                      result.allLatentScores.map((gift, index) => (
                        <div
                          key={gift.name}
                          className="flex items-center gap-4 p-4 rounded-lg border border-green-200 bg-green-50/30 hover:bg-green-50 transition-colors"
                        >
                          <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="flex-1 font-medium text-gray-900 text-base">
                            {gift.name}
                          </span>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full min-w-[65px] text-center">
                              {gift.percentage}%
                            </span>
                            <span className="text-sm text-gray-600 font-medium min-w-[55px] text-right">
                              {gift.score}/12
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer fixo */}
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <Button 
                variant="default"
                onClick={() => {
                  if (!result.allManifestScores || !result.allLatentScores) return;
                  
                  const doc = new jsPDF();
                  const pageWidth = doc.internal.pageSize.getWidth();
                  
                  // Título
                  doc.setFontSize(18);
                  doc.setFont('helvetica', 'bold');
                  doc.text('Pontuação Completa dos Dons Espirituais', pageWidth / 2, 20, { align: 'center' });
                  
                  // Informações do teste
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`Nome: ${result.personName}`, 14, 35);
                  if (result.organizationName) {
                    doc.text(`Organização: ${result.organizationName}`, 14, 41);
                  }
                  doc.text(`Data: ${format(new Date(result.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 14, result.organizationName ? 47 : 41);
                  
                  const startY = result.organizationName ? 55 : 49;
                  
                  // Tabela de Dons Manifestos
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(37, 99, 235); // blue-600
                  doc.text('Dons Manifestos (Máx: 20 pontos)', 14, startY);
                  
                  autoTable(doc, {
                    startY: startY + 5,
                    head: [['#', 'Dom', 'Percentual', 'Pontuação']],
                    body: result.allManifestScores.map((gift, index) => [
                      (index + 1).toString(),
                      gift.name,
                      `${gift.percentage}%`,
                      `${gift.score}/20`
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                    columnStyles: {
                      0: { cellWidth: 10, halign: 'center' },
                      1: { cellWidth: 70 },
                      2: { cellWidth: 28, halign: 'center' },
                      3: { cellWidth: 28, halign: 'center' }
                    },
                    margin: { left: 14, right: 14 },
                    styles: { fontSize: 9, cellPadding: 3 }
                  });
                  
                  // Tabela de Dons Latentes
                  const finalY = (doc as any).lastAutoTable.finalY + 10;
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(22, 163, 74); // green-600
                  doc.text('Dons Latentes (Máx: 12 pontos)', 14, finalY);
                  
                  autoTable(doc, {
                    startY: finalY + 5,
                    head: [['#', 'Dom', 'Percentual', 'Pontuação']],
                    body: result.allLatentScores.map((gift, index) => [
                      (index + 1).toString(),
                      gift.name,
                      `${gift.percentage}%`,
                      `${gift.score}/12`
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
                    columnStyles: {
                      0: { cellWidth: 10, halign: 'center' },
                      1: { cellWidth: 70 },
                      2: { cellWidth: 28, halign: 'center' },
                      3: { cellWidth: 28, halign: 'center' }
                    },
                    margin: { left: 14, right: 14 },
                    styles: { fontSize: 9, cellPadding: 3 }
                  });
                  
                  // Salvar PDF
                  const safeName = result.personName ? result.personName.replace(/\s+/g, '-').toLowerCase() : 'resultado';
                  const fileName = `pontuacao-completa-${safeName}.pdf`;
                  doc.save(fileName);
                }}
                className="w-full sm:w-auto"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsScoreModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
