import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  mockActivityFeed,
  mockEngagementTrend,
  mockGiftDistribution,
  mockHighlights,
  mockNextSteps,
  mockOrganizations,
  mockPlanLimits,
  mockResults,
} from "./mock-data";
import {
  ArrowUpRight,
  CalendarClock,
  Download,
  Filter,
  Layers3,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Link } from "wouter";

const formatDate = (date: string | undefined) => {
  if (!date) return "--";
  return format(new Date(date), "dd MMM yyyy", { locale: ptBR });
};

export default function AdminDashboard() {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("all");

  const organizations = useMemo(
    () => mockOrganizations.filter(org => org.id !== "all"),
    []
  );

  const selectedOrganization = useMemo(() => {
    if (selectedOrganizationId === "all") {
      return mockOrganizations.find(org => org.id === "all");
    }
    return organizations.find(org => org.id === selectedOrganizationId);
  }, [organizations, selectedOrganizationId]);

  const filteredResults = useMemo(() => {
    if (selectedOrganizationId === "all") {
      return mockResults;
    }
    return mockResults.filter(result => result.organizationId === selectedOrganizationId);
  }, [selectedOrganizationId]);

  const respondentCount = selectedOrganization?.respondentCount ?? 0;
  const completionRate = selectedOrganization?.completionRate ?? 0;
  const activeLinks = selectedOrganization?.activeLinks ?? 0;

  const awaitingExternal = filteredResults.filter(result => result.status === "awaiting_external").length;

  const chartConfig = {
    manifest: {
      label: "Manifestos",
      color: "hsl(var(--chart-1))",
    },
    latent: {
      label: "Latentes",
      color: "hsl(var(--chart-2))",
    },
  } as const;

  const engagementChartConfig = {
    completed: {
      label: "Finalizados",
      color: "hsl(var(--chart-1))",
    },
    started: {
      label: "Iniciados",
      color: "hsl(var(--chart-3))",
    },
  } as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Visão geral SaaS</p>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard administrativo</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as organizações</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
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
              Nova organização
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Respondentes ativos</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{respondentCount}</div>
              <p className="text-xs text-muted-foreground">Total vinculado à seleção atual</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de conclusão</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(completionRate * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Inclui respostas internas e externas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Links ativos</CardTitle>
              <Layers3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeLinks}</div>
              <p className="text-xs text-muted-foreground">Autoavaliação + avaliações externas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando externos</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{awaitingExternal}</div>
              <p className="text-xs text-muted-foreground">Resultados que precisam de validação</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Distribuição de dons</CardTitle>
                <CardDescription>Últimos 90 dias por tipo de dom</CardDescription>
              </div>
              <Badge variant="outline">Atualizado hoje</Badge>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[320px]">
                <BarChart data={mockGiftDistribution}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="gift" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="manifest" fill="var(--color-manifest)" radius={6} />
                  <Bar dataKey="latent" fill="var(--color-latent)" radius={6} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Engajamento mensal</CardTitle>
                <CardDescription>Comparativo de testes iniciados x concluídos</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={engagementChartConfig} className="h-[320px]">
                <LineChart data={mockEngagementTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="started" stroke="var(--color-started)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resultados recentes</CardTitle>
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
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.slice(0, 5).map(result => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.personName}</TableCell>
                      <TableCell>{result.organizationName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={result.status === "completed" ? "default" : result.status === "awaiting_external" ? "secondary" : "outline"}
                        >
                          {result.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{result.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Próximas ações</CardTitle>
              <CardDescription>Organize o onboarding da sua organização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockNextSteps.map(step => (
                <div key={step.id} className="rounded-lg border p-4">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <Button variant="link" className="px-0 mt-1">
                    {step.linkLabel}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Uso do plano</CardTitle>
              <CardDescription>Controle da assinatura atual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Respondentes</span>
                <span>
                  {mockPlanLimits.totalRespondents} / {mockPlanLimits.planLimit}
                </span>
              </div>
              <Progress value={(mockPlanLimits.totalRespondents / mockPlanLimits.planLimit) * 100} />
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span>Organizações</span>
                <span>
                  {mockPlanLimits.organizations} / {mockPlanLimits.maxOrganizations}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Atividade recente</CardTitle>
              <CardDescription>Notificações centralizadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockActivityFeed.map(activity => (
                <div key={activity.id} className="flex flex-col gap-1 border-l-2 border-primary/50 pl-3">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(activity.timestamp)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {mockHighlights.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>Top dom: {item.topGift}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-3xl font-semibold">{item.respondents}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Crescimento nos últimos 30 dias
                  <Badge variant="secondary" className="gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {(item.growth * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
