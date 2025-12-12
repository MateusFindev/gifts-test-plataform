import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { mockActivityFeed } from "./mock-data";
import {
  ArrowUpRight,
  Download,
  Filter,
  Users,
  CheckCircle,
  Clock,
  Pencil,
  Sparkles,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const formatDate = (date: string | undefined) => {
  if (!date) return "--";
  return format(new Date(date), "dd MMM yyyy", { locale: ptBR });
};

const statusMap: Record<
  string,
  {
    text: string;
    icon: React.ElementType;
    variant: "default" | "secondary" | "outline";
  }
> = {
  completed: { text: "Finalizado", icon: CheckCircle, variant: "default" },
  awaiting_external: {
    text: "Aguardando Respostas",
    icon: Clock,
    variant: "secondary",
  },
  in_progress: { text: "Em Andamento", icon: Pencil, variant: "outline" },
};

const chartConfig = {
  manifest: { label: "Dons Manifestos", color: "#2563eb" }, // azul
  latent: { label: "Dons Latentes", color: "#22c55e" }, // verde
} as const;

const engagementChartConfig = {
  completed: { label: "Testes Finalizados", color: "hsl(var(--chart-1))" },
  started: { label: "Testes Iniciados", color: "hsl(var(--chart-3))" },
} as const;

export default function AdminDashboard() {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("all");

  const selectedOrgIdNumber =
    selectedOrganizationId === "all" ? null : Number(selectedOrganizationId);

  // 3 queries: organizações, overview e resultados
  const orgQuery = trpc.adminOrganization.list.useQuery();
  const dashboardQuery = trpc.adminDashboard.overview.useQuery(
    selectedOrganizationId === "all"
      ? {}
      : { organizationId: Number(selectedOrganizationId) },
  );
  const resultsQuery = trpc.adminResult.list.useQuery();

  const organizationsRaw = orgQuery.data ?? [];

  const isLoading =
    orgQuery.isLoading || dashboardQuery.isLoading || resultsQuery.isLoading;

  const isError =
    dashboardQuery.isError || resultsQuery.isError || !dashboardQuery.data;

  const error = dashboardQuery.error ?? resultsQuery.error;
  const data = dashboardQuery.data;
  const resultsData = resultsQuery.data;

  const organizations = useMemo(
    () => organizationsRaw,
    [organizationsRaw],
  );

  // Organização selecionada (ou null para visão geral)
  const selectedOrganization = useMemo(() => {
    if (selectedOrganizationId === "all") return null;
    return (
      organizations.find(
        (org) => String(org.id) === selectedOrganizationId,
      ) ?? null
    );
  }, [organizations, selectedOrganizationId]);

  // === Métricas baseadas em resultados filtrados por organização ===

  const resultsList = resultsData ?? [];

  // Resultados considerados para métricas (por org ou todos)
  const filteredResultsForMetrics = useMemo(() => {
    if (selectedOrgIdNumber === null) return resultsList;
    return resultsList.filter(
      (r) => r.organizationId === selectedOrgIdNumber,
    );
  }, [resultsList, selectedOrgIdNumber]);

  // Quantidade de testes
  const testsCount = filteredResultsForMetrics.length;

  // Pessoas únicas (por email)
  const distinctRespondentsCount = useMemo(() => {
    const set = new Set(
      filteredResultsForMetrics
        .map((r) => r.email?.trim().toLowerCase())
        .filter(Boolean),
    );
    return set.size;
  }, [filteredResultsForMetrics]);

  // Quantidade por status
  const completedCount = filteredResultsForMetrics.filter(
    (r) => r.status === "completed",
  ).length;

  const inProgressCount = filteredResultsForMetrics.filter(
    (r) => r.status === "in_progress",
  ).length;

  const awaitingExternalCount = filteredResultsForMetrics.filter(
    (r) => r.status === "awaiting_external",
  ).length;

  // Taxa de conclusão (pra usar se quiser percentual)
  const completionRate =
    testsCount === 0 ? 0 : completedCount / testsCount;

  // (Opcional) dados para gráfico de status – se quiser usar depois
  // const statusChartData = [
  //   { status: "Concluídos", value: completedCount },
  //   { status: "Em andamento", value: inProgressCount },
  //   { status: "Aguardando externos", value: awaitingExternalCount },
  // ];

  // Últimas pessoas avaliadas (tabela) – ainda usa os recentResults do overview
  const filteredRecentResults = useMemo(() => {
    const recents = data?.recentResults ?? [];
    if (selectedOrganizationId === "all") return recents;

    const orgName =
      organizations.find(
        (org) => String(org.id) === selectedOrganizationId,
      )?.name ?? null;

    if (!orgName) return recents;

    return recents.filter((r) => r.organizationName === orgName);
  }, [data, organizations, selectedOrganizationId]);

  // === Só aqui fazemos os early returns (depois de TODAS as hooks e memos) ===
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando dados do painel...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !data || !resultsData) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-sm text-destructive">
            {error?.message ?? "Erro ao carregar dados do dashboard."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Dados para o gráfico de dons
  const giftBarData = data.giftDistribution ?? [];
  const giftChartWidth = Math.max(giftBarData.length * 80, 640);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho + filtros */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Visão Geral da Organização
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Painel de Controle
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={selectedOrganizationId}
              onValueChange={setSelectedOrganizationId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as Organizações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Organizações</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Nova Organização
            </Button>
          </div>
        </div>

        {/* Cards principais */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Testes Avaliados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Testes Avaliados
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{testsCount}</div>
              <p className="text-xs text-muted-foreground">
                Total de testes realizados nesta visão
              </p>
            </CardContent>
          </Card>

          {/* Pessoas Avaliadas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pessoas Avaliadas
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {distinctRespondentsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Pessoas únicas que já responderam ao teste
              </p>
            </CardContent>
          </Card>

          {/* Testes Finalizados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Testes Finalizados
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground">
                Testes concluídos 100% nesta visão
              </p>
            </CardContent>
          </Card>

          {/* Aguardando Respostas Externas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aguardando Avaliações Externas
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{awaitingExternalCount}</div>
              <p className="text-xs text-muted-foreground">
                Testes que ainda não receberam as avaliações externas necessárias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Os Dons Mais Comuns na Sua Organização</CardTitle>
              <CardDescription>
                Dons que as pessoas já usam (manifestos) e oportunidades de
                crescimento (latentes).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Wrapper do scroll horizontal */}
              <div className="w-full overflow-x-auto">
                <div style={{ width: giftChartWidth }}>
                  <ChartContainer config={chartConfig} className="h-[360px] w-full">
                    <BarChart
                      data={giftBarData}
                      barCategoryGap={48}
                      barGap={12}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="4 4" />
                      <XAxis
                        dataKey="gift"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="manifest"
                        name="Dons Manifestos"
                        fill="#2563eb"
                        radius={6}
                        barSize={16}
                      />
                      <Bar
                        dataKey="latent"
                        name="Dons Latentes"
                        fill="#22c55e"
                        radius={6}
                        barSize={16}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como as Pessoas Estão Usando o Teste</CardTitle>
              <CardDescription>
                Acompanhe quantos testes foram iniciados e finalizados a cada
                mês.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={engagementChartConfig}
                className="h-[320px]"
              >
                <LineChart data={data.engagementTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="started"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Últimas pessoas avaliadas + feed de atividades */}
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Últimas Pessoas Avaliadas</CardTitle>
              <Button variant="ghost" size="sm" className="gap-2" asChild>
                <Link href="/admin/results">
                  <ArrowUpRight className="h-4 w-4" />
                  Ver todos
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecentResults.slice(0, 5).map((result) => {
                    const statusInfo =
                      statusMap[result.status] || statusMap.in_progress;
                    return (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">
                          {result.name}
                        </TableCell>
                        <TableCell>
                          {result.organizationName ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusInfo.variant}
                            className="gap-1.5 pl-2"
                          >
                            <statusInfo.icon className="h-3.5 w-3.5" />
                            {statusInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/results/${result.id}`}>
                              Ver Resultado
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>O que Aconteceu Recentemente</CardTitle>
              <CardDescription>
                Um resumo das últimas atividades na sua organização.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.activityFeed && data.activityFeed.length > 0 ? (
                data.activityFeed.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col gap-1 border-l-2 border-primary/50 pl-3"
                  >
                    <p className="text-sm font-medium">{activity.message}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhuma atividade recente para os filtros selecionados.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
