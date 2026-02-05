import { useState, useMemo, useEffect } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, Trash2, Eye, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useLocation } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_CONFIG } from "@/lib/status-config";
import { useAuth } from "@/_core/hooks/useAuth";

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
  const { user } = useAuth();
  
  // Multi-seleção de status e organizações
  const [statusFilters, setStatusFilters] = useState<string[]>(["all"]);
  const [organizationFilters, setOrganizationFilters] = useState<string[]>(["all"]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [, navigate] = useLocation();

  const utils = trpc.useUtils();

  // Buscar organizações do usuário (SUPER_ADMIN vê todas, ORG_ADMIN vê apenas as suas)
  const myOrgsQuery = trpc.auth.myOrganizations.useQuery();
  const userOrganizations = myOrgsQuery.data ?? [];
  
  const organizationsQuery = trpc.adminOrganization.list.useQuery(
    undefined,
    { enabled: user?.role === "SUPER_ADMIN" }
  );
  const listQuery = trpc.adminResult.list.useQuery();
  const deleteMutation = trpc.adminResult.delete.useMutation({
    onSuccess: async () => {
      await utils.adminResult.list.invalidate();
      setDeleteDialogOpen(false);
      setResultToDelete(null);
    },
  });

  const results: AdminResult[] = listQuery.data ?? [];

  // Controle de abertura dos popovers
  const [isStatusPopoverOpen, setIsStatusPopoverOpen] = useState(false);
  const [isOrgPopoverOpen, setIsOrgPopoverOpen] = useState(false);

  // Helpers para multi-seleção
  const isAllStatusSelected = statusFilters.includes("all");
  const isAllOrgSelected = organizationFilters.includes("all");

  const toggleStatus = (status: string) => {
    if (status === "all") {
      setStatusFilters(["all"]);
      return;
    }

    setStatusFilters(prev => {
      const withoutAll = prev.filter(s => s !== "all");
      if (withoutAll.includes(status)) {
        const newSelection = withoutAll.filter(s => s !== status);
        return newSelection.length === 0 ? ["all"] : newSelection;
      } else {
        return [...withoutAll, status];
      }
    });
  };

  const toggleOrganization = (orgId: string) => {
    if (orgId === "all") {
      setOrganizationFilters(["all"]);
      return;
    }

    setOrganizationFilters(prev => {
      const withoutAll = prev.filter(id => id !== "all");
      if (withoutAll.includes(orgId)) {
        const newSelection = withoutAll.filter(id => id !== orgId);
        return newSelection.length === 0 ? ["all"] : newSelection;
      } else {
        return [...withoutAll, orgId];
      }
    });
  };

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const matchesStatus =
        isAllStatusSelected || statusFilters.includes(result.status);

      const matchesOrganization =
        isAllOrgSelected ||
        organizationFilters.includes(String(result.organizationId ?? ""));

      const lower = search.toLowerCase().trim();
      const matchesSearch =
        lower.length === 0 ||
        result.name.toLowerCase().includes(lower) ||
        result.email.toLowerCase().includes(lower);

      return matchesStatus && matchesOrganization && matchesSearch;
    });
  }, [results, statusFilters, organizationFilters, search, isAllStatusSelected, isAllOrgSelected]);

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

  // Usar organizações do usuário (SUPER_ADMIN vê todas, ORG_ADMIN vê apenas as suas)
  const availableOrganizations = useMemo(
    () => user?.role === "SUPER_ADMIN" ? (organizationsQuery.data ?? []) : userOrganizations,
    [user?.role, organizationsQuery.data, userOrganizations]
  );
  
  const orgOptions = availableOrganizations.map((org) => ({
    id: org.id,
    name: org.name,
  }));
  
  // Auto-selecionar se ORG_ADMIN tem apenas 1 organização
  useEffect(() => {
    if (user?.role === "ORG_ADMIN" && userOrganizations.length === 1) {
      setOrganizationFilters([String(userOrganizations[0].id)]);
    }
  }, [user?.role, userOrganizations]);

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

  // Textos dos seletores
  const getStatusSelectorText = () => {
    if (isAllStatusSelected) return "Todos os status";
    if (statusFilters.length === 1) {
      return STATUS_CONFIG[statusFilters[0] as keyof typeof STATUS_CONFIG]?.label ?? "Status";
    }
    return `${statusFilters.length} status selecionados`;
  };

  const getOrgSelectorText = () => {
    // Para ORG_ADMIN com múltiplas organizações, "all" significa "todas as minhas organizações"
    if (isAllOrgSelected) {
      return user?.role === "ORG_ADMIN" && userOrganizations.length > 1
        ? "Todas as minhas organizações"
        : "Todas as organizações";
    }
    if (organizationFilters.length === 1) {
      const org = orgOptions.find(o => String(o.id) === organizationFilters[0]);
      return org?.name ?? "Organizações";
    }
    return `${organizationFilters.length} organizações`;
  };

  const handleRowClick = (resultId: number) => {
    navigate(`/admin/results/${resultId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 md:px-0">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Monitoramento em tempo real
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Resultados
            </h1>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Finalizados
              </CardTitle>
              <StatusBadge status="completed" showIcon={false} />
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
                Aguardando Respostas
              </CardTitle>
              <StatusBadge status="awaiting_external" showIcon={false} />
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
                Em Andamento
              </CardTitle>
              <StatusBadge status="in_progress" showIcon={false} />
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
            <CardTitle className="text-base md:text-lg">Filtros</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Combine filtros para navegar entre os resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-4">
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
            
            {/* Filtro de Status com Multi-Seleção */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Popover open={isStatusPopoverOpen} onOpenChange={setIsStatusPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="truncate">{getStatusSelectorText()}</span>
                    <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <div className="p-2 space-y-1">
                    {/* Opção "Todos" */}
                    <div
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleStatus("all");
                      }}
                    >
                      <Checkbox
                        checked={isAllStatusSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus("all");
                        }}
                      />
                      <label className="text-sm font-medium cursor-pointer flex-1">
                        Todos os status
                      </label>
                    </div>
                    
                    <div className="border-t my-1" />
                    
                    {/* Lista de status */}
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <div
                          key={key}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleStatus(key);
                          }}
                        >
                          <Checkbox
                            checked={statusFilters.includes(key)}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(key);
                            }}
                          />
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <label className="text-sm cursor-pointer flex-1">
                            {config.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtro de Organização com Multi-Seleção */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Organização
              </label>
              <Popover open={isOrgPopoverOpen} onOpenChange={setIsOrgPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="truncate">{getOrgSelectorText()}</span>
                    <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <div className="p-2 space-y-1">
                    {/* Opção "Todas" */}
                    <div
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleOrganization("all");
                      }}
                    >
                      <Checkbox
                        checked={isAllOrgSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrganization("all");
                        }}
                      />
                      <label className="text-sm font-medium cursor-pointer flex-1">
                        {user?.role === "ORG_ADMIN" && userOrganizations.length > 1
                          ? "Todas as minhas organizações"
                          : "Todas as organizações"}
                      </label>
                    </div>
                    
                    <div className="border-t my-1" />
                    
                    {/* Lista de organizações */}
                    <div className="max-h-64 overflow-y-auto">
                      {orgOptions.map((org) => (
                        <div
                          key={org.id}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleOrganization(String(org.id));
                          }}
                        >
                          <Checkbox
                            checked={organizationFilters.includes(String(org.id))}
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
          </CardContent>
        </Card>

        {/* Lista de resultados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg">Lista de resultados</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {filteredResults.length} registros encontrados
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Respondente</TableHead>
                    <TableHead className="hidden md:table-cell">Organização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Atualização</TableHead>
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
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
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
                    <TableRow 
                      key={result.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleRowClick(result.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{result.name}</div>
                        <p className="text-xs text-muted-foreground">
                          {result.email}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {result.organizationName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={result.status} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {result.status === "completed"
                          ? formatDate(result.updatedAt)
                          : formatDate(result.createdAt)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-2"
                            asChild
                          >
                            <Link href={`/admin/results/${result.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">Ver Resultado</span>
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(result);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Excluir</span>
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
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Mostrar</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>por página</span>
                </div>
                <div className="flex items-center gap-4">
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
