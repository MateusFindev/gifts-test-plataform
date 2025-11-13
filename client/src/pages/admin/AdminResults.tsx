import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockOrganizations, mockResults } from "./mock-data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Filter, Plus, Search, Share2 } from "lucide-react";
import { Link } from "wouter";

const statusLabels: Record<string, string> = {
  completed: "Concluído",
  awaiting_external: "Aguardando externos",
  in_progress: "Em andamento",
  draft: "Rascunho",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  completed: "default",
  awaiting_external: "secondary",
  in_progress: "outline",
  draft: "outline",
};

const formatDate = (date?: string) => {
  if (!date) return "--";
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

export default function AdminResults() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredResults = useMemo(() => {
    return mockResults.filter(result => {
      const matchesStatus = statusFilter === "all" || result.status === statusFilter;
      const matchesOrganization =
        organizationFilter === "all" || result.organizationId === organizationFilter;
      const matchesSearch =
        result.personName.toLowerCase().includes(search.toLowerCase()) ||
        result.email.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesOrganization && matchesSearch;
    });
  }, [organizationFilter, search, statusFilter]);

  const totals = useMemo(() => {
    return {
      completed: filteredResults.filter(result => result.status === "completed").length,
      awaiting_external: filteredResults.filter(result => result.status === "awaiting_external").length,
      in_progress: filteredResults.filter(result => result.status === "in_progress").length,
    };
  }, [filteredResults]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Monitoramento em tempo real</p>
            <h1 className="text-3xl font-semibold tracking-tight">Resultados</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Gerar link externo
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Criar teste
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Combine filtros para navegar entre os resultados</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Buscar respondente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Nome ou e-mail"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="awaiting_external">Aguardando externos</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Organização</label>
              <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {mockOrganizations
                    .filter(org => org.id !== "all")
                    .map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totals.completed}</div>
              <p className="text-xs text-muted-foreground">Resultados com relatório completo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando externos</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totals.awaiting_external}</div>
              <p className="text-xs text-muted-foreground">Pelo menos um link externo pendente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em andamento</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totals.in_progress}</div>
              <p className="text-xs text-muted-foreground">Respondente ainda preenchendo</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de resultados</CardTitle>
              <CardDescription>{filteredResults.length} registros encontrados</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Salvar filtro
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Respondente</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map(result => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="font-medium">{result.personName}</div>
                        <p className="text-xs text-muted-foreground">{result.email}</p>
                      </TableCell>
                      <TableCell>{result.organizationName}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[result.status] ?? "outline"}>
                          {statusLabels[result.status] ?? result.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.completedAt ? formatDate(result.completedAt) : formatDate(result.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/results/${result.id}`}>Ver detalhes</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
