import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { GIFTS } from "@shared/testData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Scope = "all" | "latestPerPerson";

type AnalysisPerson = {
  testId: number;
  name: string;
  email: string;
  organizationId: number | null;
  organizationName: string | null;
  createdAt: string;
  completedAt: string | null;
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

export default function AdminAnalyses() {
  useAuth({ redirectOnUnauthenticated: true });

  const [selectedGift, setSelectedGift] = useState<string>("");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [scope, setScope] = useState<Scope>("latestPerPerson");

  const organizationsQuery = trpc.adminOrganization.list.useQuery();
  const analysisQuery = trpc.adminAnalysis.byGift.useQuery(
    {
      giftName: selectedGift,
      organizationId:
        organizationFilter === "all" ? null : Number(organizationFilter),
      scope,
    },
    {
      enabled: selectedGift.length > 0,
    },
  );

  const manifest: AnalysisPerson[] = analysisQuery.data?.manifest ?? [];
  const latent: AnalysisPerson[] = analysisQuery.data?.latent ?? [];
  const isLoading = analysisQuery.isLoading;
  const hasLoaded = !!analysisQuery.data;

  const handleExport = () => {
    if (!analysisQuery.data) return;

    const rows = [
      ...manifest.map((row) => ({ tipo: "Manifesto", ...row })),
      ...latent.map((row) => ({ tipo: "Latente", ...row })),
    ];

    if (rows.length === 0) return;

    const escape = (value: unknown) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = [
      "Tipo",
      "Nome",
      "Email",
      "Organização",
      "DataHoraTesteISO",
      "DataHoraTesteFormatada",
      "IDTeste",
    ];

    const csvLines = [
      header.join(","),
      ...rows.map((row) => {
        const dateIso = row.completedAt ?? row.createdAt;
        const dateFmt = formatDateTime(dateIso);
        return [
          escape(row.tipo),
          escape(row.name),
          escape(row.email),
          escape(row.organizationName ?? ""),
          escape(dateIso ?? ""),
          escape(dateFmt),
          escape(row.testId),
        ].join(",");
      }),
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const safeGiftName = selectedGift.replace(/\s+/g, "_");
    link.download = `analise_${safeGiftName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalManifest = manifest.length;
  const totalLatent = latent.length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Análises por Dom
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Visualize quais pessoas possuem um dom específico como{" "}
            <strong>manifesto</strong> ou <strong>latente</strong>, filtre por
            organização e escolha se deseja considerar todos os resultados ou
            apenas o último teste de cada pessoa.
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                Filtros
              </CardTitle>
              <CardDescription>
                Selecione o dom, a organização e o escopo dos resultados.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={
                !hasLoaded || (totalManifest === 0 && totalLatent === 0)
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {/* Dom */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Dom
              </span>
              <Select
                value={selectedGift}
                onValueChange={(value) => setSelectedGift(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um dom" />
                </SelectTrigger>
                <SelectContent>
                  {GIFTS.map((gift) => (
                    <SelectItem key={gift} value={gift}>
                      {gift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Organização */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Organização
              </span>
              <Select
                value={organizationFilter}
                onValueChange={(value) => setOrganizationFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por organização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {organizationsQuery.data?.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Escopo */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Escopo dos resultados
              </span>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as Scope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latestPerPerson">
                    Apenas o último resultado de cada pessoa
                  </SelectItem>
                  <SelectItem value="all">Todos os resultados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo */}
        {selectedGift.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 flex flex-col items-center justify-center gap-3 text-center">
              <Search className="h-6 w-6 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Selecione um dom para iniciar a análise
                </p>
                <p className="text-xs text-muted-foreground max-w-md">
                  Escolha um dom na área de filtros acima para ver quais pessoas
                  possuem esse dom como manifesto ou latente.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="py-10 flex items-center justify-center text-sm text-muted-foreground">
              Carregando análises...
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Manifesto */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>Dons manifestos</CardTitle>
                  <CardDescription>
                    Pessoas que têm o dom <strong>{selectedGift}</strong> como
                    manifesto.
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {totalManifest} resultado{totalManifest === 1 ? "" : "s"}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {totalManifest === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum resultado encontrado para este dom (manifesto).
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Organização</TableHead>
                          <TableHead>Realizado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manifest.map((person) => {
                          const dateIso =
                            person.completedAt ?? person.createdAt;
                          return (
                            <TableRow key={person.testId}>
                              <TableCell className="font-medium">
                                {person.name}
                              </TableCell>
                              <TableCell className="text-xs">
                                {person.email}
                              </TableCell>
                              <TableCell className="text-xs">
                                {person.organizationName ?? "-"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {formatDateTime(dateIso)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Latente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>Dons latentes</CardTitle>
                  <CardDescription>
                    Pessoas que têm o dom <strong>{selectedGift}</strong> como
                    latente.
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {totalLatent} resultado{totalLatent === 1 ? "" : "s"}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {totalLatent === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum resultado encontrado para este dom (latente).
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Organização</TableHead>
                          <TableHead>Realizado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latent.map((person) => {
                          const dateIso =
                            person.completedAt ?? person.createdAt;
                          return (
                            <TableRow key={person.testId}>
                              <TableCell className="font-medium">
                                {person.name}
                              </TableCell>
                              <TableCell className="text-xs">
                                {person.email}
                              </TableCell>
                              <TableCell className="text-xs">
                                {person.organizationName ?? "-"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {formatDateTime(dateIso)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
