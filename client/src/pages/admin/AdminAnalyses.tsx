import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
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
import { Download, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { GIFTS } from "@shared/testData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

type Scope = "all" | "latestPerPerson";

type AnalysisPerson = {
  testId: number;
  name: string;
  email: string;
  organizationId: number | null;
  organizationName: string | null;
  createdAt: string;
  completedAt: string | null;
  type: "manifest" | "latent";
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

export default function AdminAnalyses() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();

  const [selectedGift, setSelectedGift] = useState<string>("");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [scope, setScope] = useState<Scope>("latestPerPerson");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const manifest: AnalysisPerson[] = (analysisQuery.data?.manifest ?? []).map(p => ({ ...p, type: "manifest" as const }));
  const latent: AnalysisPerson[] = (analysisQuery.data?.latent ?? []).map(p => ({ ...p, type: "latent" as const }));
  
  // Combinar e ordenar por data
  const allResults = [...manifest, ...latent].sort((a, b) => {
    const dateA = new Date(a.completedAt ?? a.createdAt).getTime();
    const dateB = new Date(b.completedAt ?? b.createdAt).getTime();
    return dateB - dateA; // Mais recente primeiro
  });

  const isLoading = analysisQuery.isLoading;
  const hasLoaded = !!analysisQuery.data;

  // Paginação
  const totalItems = allResults.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = allResults.slice(startIndex, endIndex);

  // Reset para página 1 quando filtros mudarem
  const handleGiftChange = (value: string) => {
    setSelectedGift(value);
    setCurrentPage(1);
  };

  const handleOrganizationChange = (value: string) => {
    setOrganizationFilter(value);
    setCurrentPage(1);
  };

  const handleScopeChange = (value: Scope) => {
    setScope(value);
    setCurrentPage(1);
  };

  const handleExport = () => {
    if (!analysisQuery.data || allResults.length === 0) return;

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
      ...allResults.map((row) => {
        const dateIso = row.completedAt ?? row.createdAt;
        const dateFmt = formatDateTime(dateIso);
        const tipo = row.type === "manifest" ? "Manifesto" : "Latente";
        return [
          escape(tipo),
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

  const handleViewResult = (testId: number) => {
    setLocation(`/admin/results/${testId}`);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Visualize quais pessoas possuem um dom específico
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Análises por Dom
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!hasLoaded || allResults.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Dom */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dom</label>
              <Select
                value={selectedGift}
                onValueChange={handleGiftChange}
              >
                <SelectTrigger className="w-full">
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
              <label className="text-sm font-medium">Organização</label>
              <Select
                value={organizationFilter}
                onValueChange={handleOrganizationChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as organizações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as organizações</SelectItem>
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
              <label className="text-sm font-medium">Escopo</label>
              <Select
                value={scope}
                onValueChange={handleScopeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latestPerPerson">
                    Último resultado de cada pessoa
                  </SelectItem>
                  <SelectItem value="all">Todos os resultados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Resultados - Dons Manifestos */}
        {selectedGift.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Selecione um dom para visualizar os resultados
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use os filtros acima para começar a análise
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-sm text-muted-foreground">
                Carregando análises...
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Dons Manifestos */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>Dons Manifestos</CardTitle>
                    <CardDescription>
                      Pessoas que têm o dom <strong>{selectedGift}</strong> como manifesto
                    </CardDescription>
                  </div>
                  {manifest.length > 0 && (
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      {manifest.length} resultado{manifest.length === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {manifest.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum resultado encontrado para este dom (manifesto)
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="hidden md:table-cell">E-mail</TableHead>
                          <TableHead className="hidden lg:table-cell">Organização</TableHead>
                          <TableHead className="hidden sm:table-cell">Realizado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manifest.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((person) => {
                          const dateIso = person.completedAt ?? person.createdAt;
                          return (
                            <TableRow 
                              key={person.testId}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleViewResult(person.testId)}
                            >
                              <TableCell className="font-medium">
                                {person.name}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {person.email}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                {person.organizationName ?? "-"}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                {formatDateTime(dateIso)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewResult(person.testId);
                                  }}
                                  className="text-gray-900"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">Ver Resultado</span>
                                </Button>
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

            {/* Dons Latentes */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>Dons Latentes</CardTitle>
                    <CardDescription>
                      Pessoas que têm o dom <strong>{selectedGift}</strong> como latente
                    </CardDescription>
                  </div>
                  {latent.length > 0 && (
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                      {latent.length} resultado{latent.length === 1 ? "" : "s"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {latent.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum resultado encontrado para este dom (latente)
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead className="hidden md:table-cell">E-mail</TableHead>
                          <TableHead className="hidden lg:table-cell">Organização</TableHead>
                          <TableHead className="hidden sm:table-cell">Realizado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latent.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((person) => {
                          const dateIso = person.completedAt ?? person.createdAt;
                          return (
                            <TableRow 
                              key={person.testId}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleViewResult(person.testId)}
                            >
                              <TableCell className="font-medium">
                                {person.name}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {person.email}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                {person.organizationName ?? "-"}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                {formatDateTime(dateIso)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewResult(person.testId);
                                  }}
                                  className="text-gray-900"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">Ver Resultado</span>
                                </Button>
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

            {/* Paginação (apenas se houver resultados) */}
            {(manifest.length > 0 || latent.length > 0) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Itens por página:
                      </span>
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[70px]">
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
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {Math.max(1, Math.ceil(Math.max(manifest.length, latent.length) / itemsPerPage))}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(Math.max(manifest.length, latent.length) / itemsPerPage), p + 1))}
                          disabled={currentPage >= Math.ceil(Math.max(manifest.length, latent.length) / itemsPerPage)}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
