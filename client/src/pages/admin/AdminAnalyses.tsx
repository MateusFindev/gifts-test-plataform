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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, Eye, ChevronDown, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
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

  // Restaurar filtros salvos ou usar padrões
  const savedFilters = sessionStorage.getItem('analysisFilters');
  const initialFilters = savedFilters ? JSON.parse(savedFilters) : {
    selectedGift: "",
    organizationFilter: "all",
    scope: "latestPerPerson" as Scope,
  };

  const [selectedGift, setSelectedGift] = useState<string>(initialFilters.selectedGift);
  const [organizationFilter, setOrganizationFilter] = useState<string>(initialFilters.organizationFilter);
  const [scope, setScope] = useState<Scope>(initialFilters.scope);


  const organizationsQuery = trpc.adminOrganization.list.useQuery();
  const orgOptions = organizationsQuery.data ?? [];
  
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

  // Handlers
  const handleGiftChange = (value: string) => {
    setSelectedGift(value);
  };

  const handleOrganizationChange = (value: string) => {
    setOrganizationFilter(value);
  };

  const handleScopeChange = (value: Scope) => {
    setScope(value);
  };

  const handleExportExcel = () => {
    if (!analysisQuery.data || (manifest.length === 0 && latent.length === 0)) return;

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Worksheet 1: Dons Manifestos
    const manifestData = manifest.map((row) => ({
      Nome: row.name,
      Email: row.email,
      Organização: row.organizationName ?? "-",
      Data: formatDateTime(row.completedAt ?? row.createdAt),
      "ID Teste": row.testId,
    }));
    const ws1 = XLSX.utils.json_to_sheet(manifestData);
    XLSX.utils.book_append_sheet(wb, ws1, "Dons Manifestos");

    // Worksheet 2: Dons Latentes
    const latentData = latent.map((row) => ({
      Nome: row.name,
      Email: row.email,
      Organização: row.organizationName ?? "-",
      Data: formatDateTime(row.completedAt ?? row.createdAt),
      "ID Teste": row.testId,
    }));
    const ws2 = XLSX.utils.json_to_sheet(latentData);
    XLSX.utils.book_append_sheet(wb, ws2, "Dons Latentes");

    // Gerar e baixar arquivo
    const safeGiftName = selectedGift.replace(/\s+/g, "_");
    XLSX.writeFile(wb, `analise_${safeGiftName}.xlsx`);
  };

  const handleViewResult = (testId: number) => {
    // Salvar estado dos filtros e URL de origem
    sessionStorage.setItem('analysisFilters', JSON.stringify({
      selectedGift,
      organizationFilter,
      scope,
    }));
    sessionStorage.setItem('returnTo', '/admin/analyses');
    setLocation(`/admin/results/${testId}`);
  };

  const handleExportPDF = () => {
    if (!analysisQuery.data || allResults.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Título
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(`Análise do Dom: ${selectedGift}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    // Informações
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const orgName = organizationFilter === "all" 
      ? "Todas as organizações" 
      : orgOptions.find(o => String(o.id) === organizationFilter)?.name ?? "";
    doc.text(`Organização: ${orgName}`, 14, yPos);
    yPos += 6;
    doc.text(`Escopo: ${scope === "latestPerPerson" ? "Último resultado de cada pessoa" : "Todos os resultados"}`, 14, yPos);
    yPos += 6;
    doc.text(`Data: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, yPos);
    yPos += 10;

    // Tabela Dons Manifestos
    if (manifest.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("Dons Manifestos", 14, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${manifest.length} resultado${manifest.length === 1 ? "" : "s"}`, 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [["Nome", "E-mail", "Organização", "Realizado em"]],
        body: manifest.map((p) => [
          p.name,
          p.email,
          p.organizationName ?? "-",
          formatDateTime(p.completedAt ?? p.createdAt),
        ]),
        theme: "striped",
        headStyles: {
          fillColor: [37, 99, 235], // blue-600
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [239, 246, 255], // blue-50
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 50 },
          2: { cellWidth: 45 },
          3: { cellWidth: 32 },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Tabela Dons Latentes
    if (latent.length > 0) {
      // Nova página se necessário
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(22, 163, 74); // green-600
      doc.text("Dons Latentes", 14, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${latent.length} resultado${latent.length === 1 ? "" : "s"}`, 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [["Nome", "E-mail", "Organização", "Realizado em"]],
        body: latent.map((p) => [
          p.name,
          p.email,
          p.organizationName ?? "-",
          formatDateTime(p.completedAt ?? p.createdAt),
        ]),
        theme: "striped",
        headStyles: {
          fillColor: [22, 163, 74], // green-600
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [240, 253, 244], // green-50
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 50 },
          2: { cellWidth: 45 },
          3: { cellWidth: 32 },
        },
      });
    }

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }

    const safeGiftName = selectedGift.replace(/\s+/g, "_");
    doc.save(`analise_${safeGiftName}.pdf`);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={!hasLoaded || allResults.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Filtros</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Selecione os critérios para filtrar os resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Dom */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Dom</label>
              <Select
                value={selectedGift}
                onValueChange={handleGiftChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um dom" />
                </SelectTrigger>
                <SelectContent>
                  {[...GIFTS].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((gift) => (
                    <SelectItem key={gift} value={gift}>
                      {gift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Organização */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Organização</label>
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
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Escopo</label>
              <Select
                value={scope}
                onValueChange={(value) => handleScopeChange(value as Scope)}
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
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Dons Manifestos */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base md:text-lg">Dons Manifestos</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
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
                        {manifest.map((person) => {
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
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewResult(person.testId);
                                }}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
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
                    <CardTitle className="text-base md:text-lg">Dons Latentes</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
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
                        {latent.map((person) => {
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
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewResult(person.testId);
                                  }}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
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

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
