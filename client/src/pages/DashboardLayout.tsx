import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  completed: "Concluído",
  awaiting_external: "Aguardando externos",
  in_progress: "Em andamento",
  draft: "Rascunho",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  completed: "default",
  awaiting_external: "secondary",
  in_progress: "outline",
  draft: "outline",
};

const formatDateTime = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
};

export default function AdminDashboard() {
  const { data, isLoading, isError, error } = trpc.adminDashboard.overview.useQuery();

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

  if (isError || !data) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <CardTitle>Erro ao carregar dashboard</CardTitle>
              <CardDescription>
                {error?.message ?? "Ocorreu um erro ao carregar os dados."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { results, organizations, users, recentResults } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Visão geral da plataforma
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
        </div>

        {/* Cards principais */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Testes respondidos
              </CardTitle>
              <CardDescription>Total de respostas registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{results.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {results.completed} concluídos · {results.inProgress} em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Aguardando externos
              </CardTitle>
              <CardDescription>Testes pendentes de avaliação externa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {results.awaitingExternal}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando retornos de convidados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Organizações ativas
              </CardTitle>
              <CardDescription>Parcerias usando a plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {organizations.active}/{organizations.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Organizações ativas / total cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários admin
              </CardTitle>
              <CardDescription>Perfis com acesso ao painel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {users.superAdmins} super admin · {users.orgAdmins} org admin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de resultados recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados recentes</CardTitle>
            <CardDescription>
              Últimos testes atualizados na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum resultado registrado até o momento.
              </p>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Respondente</TableHead>
                      <TableHead>Organização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Atualizado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentResults.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{r.name}</div>
                          <p className="text-xs text-muted-foreground">
                            {r.email}
                          </p>
                        </TableCell>
                        <TableCell>
                          {r.organizationName ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariants[r.status] ?? "outline"}
                          >
                            {statusLabels[r.status] ?? r.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(r.updatedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
