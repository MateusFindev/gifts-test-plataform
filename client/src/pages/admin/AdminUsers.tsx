import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Filter, Plus, Users as UsersIcon, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type Role = "SUPER_ADMIN" | "ORG_ADMIN" | "END_USER";
type AdminUserStatus = "active" | "invited" | "blocked";

type UserFormState = {
  name: string;
  email: string;
  role: Role;
  password: string;
  organizationId: number | null;
};

const emptyFormState: UserFormState = {
  name: "",
  email: "",
  role: "END_USER",
  password: "",
  organizationId: null,
};

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ORG_ADMIN: "Admin da Organização",
  END_USER: "Usuário Final",
};

const statusLabels: Record<AdminUserStatus, string> = {
  active: "Ativo",
  invited: "Convidado",
  blocked: "Bloqueado",
};

const statusVariants: Record<AdminUserStatus, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  invited: "secondary",
  blocked: "destructive",
};

const formatDateTime = (date?: Date | string | null) => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

export default function AdminUsers() {
  useAuth({ redirectOnUnauthenticated: true });

  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState<UserFormState>(emptyFormState);

  const listQuery = trpc.adminUser.list.useQuery();
  const orgsQuery = trpc.adminUser.organizations.useQuery();

  const createMutation = trpc.adminUser.create.useMutation({
    onSuccess: async () => {
      await utils.adminUser.list.invalidate();
      closeDialog();
    },
  });

  const updateMutation = trpc.adminUser.update.useMutation({
    onSuccess: async () => {
      await utils.adminUser.list.invalidate();
      closeDialog();
    },
  });

  const deleteMutation = trpc.adminUser.delete.useMutation({
    onSuccess: async () => {
      await utils.adminUser.list.invalidate();
    },
  });

  const users = listQuery.data ?? [];
  const organizations = orgsQuery.data ?? [];

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        search.trim().length === 0 ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === "active").length;
    const invited = users.filter(u => u.status === "invited").length;
    const blocked = users.filter(u => u.status === "blocked").length;
    const superAdmins = users.filter(u => u.role === "SUPER_ADMIN").length;

    return { total, active, invited, blocked, superAdmins };
  }, [users]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormState(emptyFormState);
    setIsDialogOpen(true);
  };

  const openEditDialog = (id: number) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    setEditingId(user.id);
    setFormState({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      organizationId: user.organizationId ?? null,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormState(emptyFormState);
  };

  const handleDeleteUser = (id: number, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${name}"?`)) {
      return;
    }
    deleteMutation.mutate({ id });
  };

  const handleSubmit = () => {
    if (!formState.name.trim() || !formState.email.trim()) {
      alert("Nome e e-mail são obrigatórios.");
      return;
    }

    const requiresOrg = formState.role !== "SUPER_ADMIN";
    if (requiresOrg && !formState.organizationId) {
      alert("Selecione uma organização para Admin de organização ou Usuário final.");
      return;
    }

    const basePayload = {
      name: formState.name.trim(),
      email: formState.email.trim(),
      role: formState.role,
      organizationId: requiresOrg ? formState.organizationId : null,
    };

    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        ...basePayload,
        password: formState.password || null,
      });
    } else {
      if (!formState.password.trim()) {
        alert("A senha é obrigatória na criação do usuário.");
        return;
      }

      createMutation.mutate({
        ...basePayload,
        password: formState.password.trim(),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isOrgFieldDisabled = formState.role === "SUPER_ADMIN";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-primary" />
              Usuários
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie administradores, líderes de organizações e participantes da plataforma.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo usuário
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de usuários</CardDescription>
              <CardTitle className="text-3xl">
                {listQuery.isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Contando todos os perfis cadastrados.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ativos</CardDescription>
              <CardTitle className="text-3xl">{stats.active}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Usuários com acesso liberado.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Convidados</CardDescription>
              <CardTitle className="text-3xl">{stats.invited}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Aguardando aceitação do convite.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Super Admins</CardDescription>
              <CardTitle className="text-3xl">{stats.superAdmins}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Contas com acesso total ao painel.
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine a visualização dos usuários cadastrados.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-1 block">Buscar usuário</Label>
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Nome ou e-mail"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Papel</Label>
              <Select
                value={roleFilter}
                onValueChange={value =>
                  setRoleFilter(value === "all" ? "all" : (value as Role))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ORG_ADMIN">Admin da organização</SelectItem>
                  <SelectItem value="END_USER">Usuário final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={value =>
                  setStatusFilter(value === "all" ? "all" : (value as AdminUserStatus))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="invited">Convidado</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de usuários</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os usuários com acesso à plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className="w-[160px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                        Carregando usuários...
                      </TableCell>
                    </TableRow>
                  )}

                  {!listQuery.isLoading && filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum usuário encontrado com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  )}

                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{roleLabels[user.role]}</TableCell>
                      <TableCell>{user.organizationName ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[user.status]}>{statusLabels[user.status]}</Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(user.lastSignedIn)}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user.id)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
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

        {/* Dialog de criação/edição */}
        <Dialog open={isDialogOpen} onOpenChange={open => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId !== null ? "Editar usuário" : "Criar usuário"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formState.name}
                  onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formState.email}
                  onChange={e => setFormState(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Papel</Label>
                <Select
                  value={formState.role}
                  onValueChange={value =>
                    setFormState(prev => ({
                      ...prev,
                      role: value as Role,
                      // se virar SUPER_ADMIN, zera organização
                      organizationId: value === "SUPER_ADMIN" ? null : prev.organizationId,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="ORG_ADMIN">Admin da organização</SelectItem>
                    <SelectItem value="END_USER">Usuário final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Organização {formState.role !== "SUPER_ADMIN" && <span className="text-red-500">*</span>}</Label>
                <Select
                  value={formState.organizationId ? String(formState.organizationId) : ""}
                  onValueChange={value =>
                    setFormState(prev => ({
                      ...prev,
                      organizationId: value ? Number(value) : null,
                    }))
                  }
                  disabled={isOrgFieldDisabled || orgsQuery.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isOrgFieldDisabled
                          ? "Não aplicável para Super Admin"
                          : orgsQuery.isLoading
                          ? "Carregando organizações..."
                          : "Selecione uma organização"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={String(org.id)}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Senha {editingId === null && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="password"
                  placeholder={
                    editingId === null
                      ? "Defina a senha de acesso"
                      : "Preencha para alterar a senha (opcional)"
                  }
                  value={formState.password}
                  onChange={e =>
                    setFormState(prev => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId !== null ? "Salvar alterações" : "Criar usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
