import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockOrganizations } from "./mock-data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Users } from "lucide-react";

const formatDate = (date: string) => format(new Date(date), "dd/MM/yyyy", { locale: ptBR });

type OrganizationFormState = {
  name: string;
  contactName: string;
  contactEmail: string;
  plan: "starter" | "growth" | "scale";
};

export default function AdminOrganizations() {
  const [organizations, setOrganizations] = useState(() =>
    mockOrganizations.filter(org => org.id !== "all")
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<OrganizationFormState>({
    name: "",
    contactName: "",
    contactEmail: "",
    plan: "starter",
  });

  const metrics = useMemo(() => {
    const totalRespondents = organizations.reduce(
      (acc, org) => acc + org.respondentCount,
      0
    );
    const averageCompletion =
      organizations.reduce((acc, org) => acc + org.completionRate, 0) /
      organizations.length;

    return {
      totalRespondents,
      organizations: organizations.length,
      averageCompletion,
    };
  }, [organizations]);

  const handleCreateOrganization = () => {
    setOrganizations(prev => [
      {
        id: formState.name.toLowerCase().replace(/\s+/g, "-"),
        name: formState.name,
        slug: formState.name.toLowerCase().replace(/\s+/g, "-"),
        plan: formState.plan,
        respondentCount: 0,
        completionRate: 0,
        activeLinks: 0,
        createdAt: new Date().toISOString(),
        contactName: formState.contactName,
        contactEmail: formState.contactEmail,
      },
      ...prev,
    ]);
    setFormState({ name: "", contactName: "", contactEmail: "", plan: "starter" });
    setDialogOpen(false);
  };

  const planBadges: Record<string, string> = {
    starter: "Starter",
    growth: "Growth",
    scale: "Scale",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Gestão multi-tenant</p>
            <h1 className="text-3xl font-semibold tracking-tight">Organizações</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Nova organização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar organização</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formState.name}
                    onChange={event => setFormState(prev => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input
                    value={formState.contactName}
                    onChange={event => setFormState(prev => ({ ...prev, contactName: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formState.contactEmail}
                    onChange={event => setFormState(prev => ({ ...prev, contactEmail: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select
                    value={formState.plan}
                    onValueChange={value =>
                      setFormState(prev => ({ ...prev, plan: value as OrganizationFormState["plan"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="scale">Scale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateOrganization} disabled={!formState.name.trim()}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizações ativas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.organizations}</div>
              <p className="text-xs text-muted-foreground">Multi-tenant configurado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Respondentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalRespondents}</div>
              <p className="text-xs text-muted-foreground">Somatório entre todas as organizações</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa média de conclusão</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(metrics.averageCompletion * 100).toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Inclui testes auto e externos</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de organizações</CardTitle>
            <CardDescription>Informações consolidadas por tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Respondentes</TableHead>
                    <TableHead>Taxa de conclusão</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map(org => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{planBadges[org.plan]}</Badge>
                      </TableCell>
                      <TableCell>{org.respondentCount}</TableCell>
                      <TableCell>{(org.completionRate * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{org.contactName}</p>
                        <p className="text-xs text-muted-foreground">{org.contactEmail}</p>
                      </TableCell>
                      <TableCell>{formatDate(org.createdAt)}</TableCell>
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
