import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Filter, Search, Loader2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

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

const formatDate = (date?: string) => {
  if (!date) return "--";
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

type AdminResult = {
  id: number;
  name: string;
  email: string;
  organizationId: number | null;
  organizationName: string | null;
  status: "completed" | "awaiting_external" | "in_progress" | "draft";
  createdAt: string;
  updatedAt: string;
};

export default function AdminResults() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const utils = trpc.useUtils();

  const organizationsQuery = trpc.adminOrganization.list.useQuery();
  const listQuery = trpc.adminResult.list.useQuery();
  const deleteMutation = trpc.adminResult.delete.useMutation({
    onSuccess: async () => {
      await utils.adminResult.list.invalidate();
      setDeleteDialogOpen(false);
      setResultToDelete(null);
    },
  });

  const results: AdminResult[] = listQuery.data ?? [];

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const matchesStatus =
        statusFilter === "all" || result.status === statusFilter;

      const matchesOrganization =
        organizationFilter === "all" ||
        String(result.organizationId ?? "") === organizationFilter;

      const lower = search.toLowerCase().trim();
      const matchesSearch =
        lower.length === 0 ||
        result.name.toLowerCase().includes(lower) ||
        result.email.toLowerCase().includes(lower);

      return matchesStatus && matchesOrganization && matchesSearch;
    });
  }, [results, statusFilter, organizationFilter, search]);

  const totals = useMemo(() => {
    return {
      completed: filteredResults.filter(
        (result) => result.status === "completed",
      ).length,
      awaiting_external: filteredResults.filter(
        (result) => result.status === "awaiting_external",
      ).length,
      in_progress: filteredResults.filter(
        (result) => result.status === "in_progress",
      ).length,
    };
  }, [filteredResults]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const orgOptions =
    organizationsQuery.data?.map((org) => ({
      id: org.id,
      name: org.name,
    })) ?? [];

  // --- Modal exclusão ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<AdminResult | null>(
    null,
  );

  const openDeleteDialog = (result: AdminResult) => {
    setResultToDelete(result);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) return;
    setDeleteDialogOpen(false);
    setResultToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!resultToDelete) return;
    deleteMutation.mutate({ id: resultToDelete.id });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Monitoramento em tempo real
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Resultados
            </h1>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Concluídos
              </CardTitle>
              <Badge variant="default">OK</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totals.completed}</div>
              <p className="text-xs text-muted-foreground">
                Testes com resultado completo
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aguardando externos
              </CardTitle>
              <Badge variant="secondary">Follow-up</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totals.awaiting_external}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando respostas das avaliações externas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Em andamento
              </CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totals.in_progress}</div>
              <p className="text-xs text-muted-foreground">
                Respondente ainda preenchendo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Combine filtros para navegar entre os resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">
                Buscar respondente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
                  <SelectItem value="awaiting_external">
                    Aguardando externos
                  </SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Organização
              </label>
              <Select
                value={organizationFilter}
                onValueChange={setOrganizationFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {orgOptions.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de resultados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de resultados</CardTitle>
              <CardDescription>
                {filteredResults.length} registros encontrados
              </CardDescription>
            </div>
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
                  {listQuery.isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                        Carregando resultados...
                      </TableCell>
                    </TableRow>
                  )}

                  {!listQuery.isLoading &&
                    paginatedResults.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          Nenhum resultado encontrado com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}

                  {paginatedResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="font-medium">{result.name}</div>
                        <p className="text-xs text-muted-foreground">
                          {result.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        {result.organizationName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariants[result.status] ?? "outline"}
                        >
                          {statusLabels[result.status] ?? result.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.status === "completed"
                          ? formatDate(result.updatedAt)
                          : formatDate(result.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/results/${result.id}`}>
                              Ver detalhes
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => openDeleteDialog(result)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {filteredResults.length > 0 && (
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div>
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de confirmação de exclusão */}
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeDeleteDialog();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir o resultado de{" "}
              <span className="font-medium">
                {resultToDelete?.name ?? "—"}
              </span>
              ? Essa ação não poderá ser desfeita.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={closeDeleteDialog}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
