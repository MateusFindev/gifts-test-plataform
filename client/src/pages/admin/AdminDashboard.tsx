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
  Users,
  CheckCircle,
  Clock,
  Pencil,
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
  ResponsiveContainer,
} from "recharts";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

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
  // Mudança: agora é um array de IDs de organizações selecionadas
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>(["all"]);

  // Se "all" está selecionado, consideramos todas as organizações
  const isAllSelected = selectedOrganizationIds.includes("all");

  // Converter para números (exceto "all")
  const selectedOrgIdNumbers = isAllSelected 
    ? null 
    : selectedOrganizationIds.map(id => Number(id));

  // 3 queries: organizações, overview e resultados
  const orgQuery = trpc.adminOrganization.list.useQuery();
  const dashboardQuery = trpc.adminDashboard.overview.useQuery(
    isAllSelected
      ? {}
      : { organizationId: selectedOrgIdNumbers?.[0] ?? undefined }, // API ainda espera um único ID, mas podemos adaptar
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

  // Handler para multi-seleção de organizações
  const toggleOrganization = (orgId: string) => {
    if (orgId === "all") {
      setSelectedOrganizationIds(["all"]);
      return;
    }

    setSelectedOrganizationIds(prev => {
      // Remove "all" se estava selecionado
      const withoutAll = prev.filter(id => id !== "all");
      
      // Toggle da organização
      if (withoutAll.includes(orgId)) {
        const newSelection = withoutAll.filter(id => id !== orgId);
        // Se não sobrou nenhuma, volta para "all"
        return newSelection.length === 0 ? ["all"] : newSelection;
      } else {
        return [...withoutAll, orgId];
      }
    });
  };

  // === Métricas baseadas em resultados filtrados por organização ===

  const resultsList = resultsData ?? [];

  // Resultados considerados para métricas (por org ou todos)
  const filteredResultsForMetrics = useMemo(() => {
    if (isAllSelected) return resultsList;
    return resultsList.filter(
      (r) => selectedOrgIdNumbers?.includes(r.organizationId ?? 0),
    );
  }, [resultsList, selectedOrgIdNumbers, isAllSelected]);

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

  // Últimas pessoas avaliadas (tabela) – ainda usa os recentResults do overview
  const filteredRecentResults = useMemo(() => {
    const recents = data?.recentResults ?? [];
    if (isAllSelected) return recents;

    const selectedOrgNames = organizations
      .filter(org => selectedOrgIdNumbers?.includes(org.id))
      .map(org => org.name);

    return recents.filter((r) => selectedOrgNames.includes(r.organizationName ?? ""));
  }, [data, organizations, selectedOrgIdNumbers, isAllSelected]);

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

  // Texto do seletor de organizações
  const getOrganizationSelectorText = () => {
    if (isAllSelected) return "Todas as Organizações";
    if (selectedOrganizationIds.length === 1) {
      const org = organizations.find(o => String(o.id) === selectedOrganizationIds[0]);
      return org?.name ?? "Selecione organizações";
    }
    return `${selectedOrganizationIds.length} organizações selecionadas`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 md:px-0">
        {/* Cabeçalho + filtros */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Visão Geral da Organização
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Painel de Controle
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Seletor de Organizações com Multi-Seleção */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-64 justify-between">
                  <span className="truncate">{getOrganizationSelectorText()}</span>
                  <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-2 space-y-1">
                  {/* Opção "Todas as Organizações" */}
                  <div
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => toggleOrganization("all")}
                  >
                    <Checkbox
                      checked={isAllSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOrganization("all");
                      }}
                    />
                    <label className="text-sm font-medium cursor-pointer flex-1">
                      Todas as Organizações
                    </label>
                  </div>
                  
                  <div className="border-t my-1" />
                  
                  {/* Lista de organizações */}
                  <div className="max-h-64 overflow-y-auto">
                    {organizations.map((org) => (
                      <div
                        key={org.id}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => toggleOrganization(String(org.id))}
                      >
                        <Checkbox
                          checked={selectedOrganizationIds.includes(String(org.id))}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrganization(String(org.id));
                          }}
                        />
                        <label className="text-sm cursor-pointer flex-1">
                          {org.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Cards principais */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
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
                Testes que foram completamente finalizados
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
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Os Dons Mais Comuns na Sua Organização</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Dons que as pessoas já usam (manifestos) e oportunidades de
                crescimento (latentes).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Wrapper do scroll horizontal com barra visível */}
              <div className="w-full overflow-x-auto overflow-y-hidden pb-2" style={{ scrollbarWidth: 'thin' }}>
                <div style={{ minWidth: `${Math.max(giftBarData.length * 80, 600)}px` }}>
                  <ChartContainer config={chartConfig} className="h-[300px] md:h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={giftBarData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
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
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
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
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Como as Pessoas Estão Usando o Teste</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Acompanhe quantos testes foram iniciados e finalizados a cada
                mês.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <ChartContainer
                config={engagementChartConfig}
                className="h-[300px] md:h-[320px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={data.engagementTrend ?? []}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
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
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Últimas pessoas avaliadas + feed de atividades */}
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base md:text-lg">Últimas Pessoas Avaliadas</CardTitle>
              <Button variant="ghost" size="sm" className="gap-2" asChild>
                <Link href="/admin/results">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="hidden sm:inline">Ver todos</span>
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">Organização</TableHead>
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
                        <TableCell className="hidden sm:table-cell">
                          {result.organizationName ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusInfo.variant}
                            className="gap-1.5 pl-2 text-xs"
                          >
                            <statusInfo.icon className="h-3 w-3" />
                            <span className="hidden sm:inline">{statusInfo.text}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/results/${result.id}`}>
                              <span className="hidden sm:inline">Ver Resultado</span>
                              <span className="sm:hidden">Ver</span>
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
              <CardTitle className="text-base md:text-lg">O que Aconteceu Recentemente</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Um resumo das últimas atividades na sua organização.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.activityFeed && data.activityFeed.length > 0 ? (
                data.activityFeed.slice(0, 5).map((activity) => (
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
