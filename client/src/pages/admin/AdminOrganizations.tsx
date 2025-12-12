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
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, Users, Edit, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type AdminOrganization = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  contactName: string | null;
  isActive: boolean;
  createdAt: string;
  respondentCount: number;
  completedCount: number;
  completionRate: number; // 0–1
};

type OrgFormState = {
  name: string;
  email: string;
  contactName: string;
  isActive: "active" | "inactive";
};

const emptyFormState: OrgFormState = {
  name: "",
  email: "",
  contactName: "",
  isActive: "active",
};

const formatDate = (iso: string) =>
  format(new Date(iso), "dd/MM/yyyy", { locale: ptBR });

export default function AdminOrganizations() {
  // garante que só admin logado acesse
  useAuth({ redirectOnUnauthenticated: true });

  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState<OrgFormState>(emptyFormState);

  const listQuery = trpc.adminOrganization.list.useQuery();
  const createMutation = trpc.adminOrganization.create.useMutation({
    onSuccess: async () => {
      await utils.adminOrganization.list.invalidate();
      closeDialog();
    },
  });
  const updateMutation = trpc.adminOrganization.update.useMutation({
    onSuccess: async () => {
      await utils.adminOrganization.list.invalidate();
      closeDialog();
    },
  });
  const deleteMutation = trpc.adminOrganization.delete.useMutation({
    onSuccess: async () => {
      await utils.adminOrganization.list.invalidate();
    },
    onError: (error) => {
      // regra do backend: se tiver respostas vinculadas, não deixa excluir
      alert(error.message);
    },
  });

  const orgs: AdminOrganization[] = listQuery.data ?? [];

  const filteredOrgs = useMemo(() => {
    return orgs.filter((org) => {
      const matchesSearch =
        search.trim().length === 0 ||
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase()) ||
        (org.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (org.contactName ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && org.isActive) ||
        (statusFilter === "inactive" && !org.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [orgs, search, statusFilter]);

  const metrics = useMemo(() => {
    const activeOrgs = orgs.filter((o) => o.isActive).length;
    const totalRespondents = orgs.reduce(
      (sum, o) => sum + o.respondentCount,
      0,
    );
    const totalCompleted = orgs.reduce(
      (sum, o) => sum + o.completedCount,
      0,
    );
    const overallCompletionRate =
      totalRespondents === 0 ? 0 : totalCompleted / totalRespondents;

    return {
      activeOrgs,
      totalRespondents,
      overallCompletionRate,
    };
  }, [orgs]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormState(emptyFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (org: AdminOrganization) => {
    setEditingId(org.id);
    setFormState({
      name: org.name,
      email: org.email ?? "",
      contactName: org.contactName ?? "",
      isActive: org.isActive ? "active" : "inactive",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormState(emptyFormState);
  };

  const handleSubmit = () => {
    if (!formState.name.trim()) {
      alert("O nome da organização é obrigatório.");
      return;
    }

    const payload = {
      name: formState.name.trim(),
      email: formState.email.trim() || null,
      contactName: formState.contactName.trim() || null,
      isActive: formState.isActive === "active",
    };

    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        ...payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (org: AdminOrganization) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a organização "${org.name}"?\nSe existirem respostas vinculadas, você precisará desativá-la em vez de excluir.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate({ id: org.id });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho + botão nova organização */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Gestão multi-tenant</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Organizações
            </h1>
          </div>
          <Button className="gap-2" onClick={openCreateDialog}>
            <Sparkles className="h-4 w-4" />
            Nova organização
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Organizações ativas
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {listQuery.isLoading ? "…" : metrics.activeOrgs}
              </div>
              <p className="text-xs text-muted-foreground">
                Com status &quot;Ativa&quot;
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Respondentes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {listQuery.isLoading ? "…" : metrics.totalRespondents}
              </div>
              <p className="text-xs text-muted-foreground">
                Soma geral de pessoas que iniciaram o teste
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa média de conclusão
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {listQuery.isLoading
                  ? "…"
                  : `${(metrics.overallCompletionRate * 100).toFixed(0)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Baseado em testes concluídos vs. iniciados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Refine a visualização das organizações cadastradas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-1 block">Buscar</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, e-mail, contato ou slug"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "all" | "active" | "inactive")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de organizações</CardTitle>
            <CardDescription>
              Visualize, edite e gerencie as organizações da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Respondentes</TableHead>
                    <TableHead>Taxa conclusão</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="w-[200px] text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Carregando organizações...
                      </TableCell>
                    </TableRow>
                  )}

                  {!listQuery.isLoading && filteredOrgs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        Nenhuma organização encontrada com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  )}

                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell className="text-sm">
                        {org.email || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {org.contactName || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.isActive ? "default" : "outline"}>
                          {org.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>{org.respondentCount}</TableCell>
                      <TableCell>
                        {(org.completionRate * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell>{formatDate(org.createdAt)}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(org)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(org)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Criar/Editar */}
        <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar organização" : "Criar organização"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nome da organização"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail (contato)</Label>
                <Input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="email@organizacao.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do contato</Label>
                <Input
                  value={formState.contactName}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      contactName: event.target.value,
                    }))
                  }
                  placeholder="Responsável pela organização"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formState.isActive}
                  onValueChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      isActive: value as "active" | "inactive",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingId && (
                <p className="text-xs text-muted-foreground">
                  A taxa de conclusão é calculada automaticamente com base nos
                  testes realizados e não pode ser editada manualmente.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {editingId ? "Salvar alterações" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
