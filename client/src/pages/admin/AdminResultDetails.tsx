import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockResults } from "./mock-data";
import { ArrowLeft, Download, Mail, Share2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatDate = (date?: string) => {
  if (!date) return "--";
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

type AdminResultDetailsProps = {
  params?: {
    resultId?: string;
  };
};

export default function AdminResultDetails({ params }: AdminResultDetailsProps) {
  const [, setLocation] = useLocation();
  const resultId = params?.resultId ?? "";
  const result = mockResults.find(item => item.id === resultId);

  if (!result) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <CardTitle>Resultado não encontrado</CardTitle>
              <CardDescription>
                O identificador informado não existe ou foi removido. Retorne para a lista e tente novamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/admin/results")}>Voltar</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" className="gap-2 w-fit" asChild>
              <Link href="/admin/results">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Resultado #{result.id}</p>
              <h1 className="text-3xl font-semibold tracking-tight">{result.personName}</h1>
              <p className="text-sm text-muted-foreground">{result.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">{result.status}</Badge>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumo geral</CardTitle>
              <CardDescription>Informações consolidadas do respondente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Organização</p>
                  <p className="text-lg font-semibold">{result.organizationName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="text-lg font-semibold">{formatDate(result.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Finalizado em</p>
                  <p className="text-lg font-semibold">{formatDate(result.completedAt)}</p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Pontuação geral</p>
                  <div className="text-4xl font-bold">{result.score}</div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Etiquetas</p>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map(tag => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contato e acompanhamento</CardTitle>
              <CardDescription>Informe ao respondente o próximo passo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {result.email}
              </div>
              <Button className="w-full">Enviar lembrete</Button>
              <Button variant="secondary" className="w-full">
                Duplicar link externo
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="manifest" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manifest">Dons manifestos</TabsTrigger>
            <TabsTrigger value="latent">Dons latentes</TabsTrigger>
          </TabsList>
          <TabsContent value="manifest">
            <Card>
              <CardHeader>
                <CardTitle>Destaques manifestos</CardTitle>
                <CardDescription>Principais dons identificados pelo teste completo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.manifestGifts.map(gift => (
                  <div key={gift.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{gift.name}</span>
                      <span>{gift.value}%</span>
                    </div>
                    <Progress value={gift.value} />
                    <p className="text-sm text-muted-foreground mt-1">{gift.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="latent">
            <Card>
              <CardHeader>
                <CardTitle>Oportunidades de desenvolvimento</CardTitle>
                <CardDescription>Dons que podem ser estimulados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.latentGifts.map(gift => (
                  <div key={gift.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{gift.name}</span>
                      <span>{gift.value}%</span>
                    </div>
                    <Progress value={gift.value} />
                    <p className="text-sm text-muted-foreground mt-1">{gift.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Avaliações externas</CardTitle>
            <CardDescription>Status dos convidados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.externalAssessments.map(assessment => (
              <div key={assessment.name} className="flex flex-col gap-1 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{assessment.name}</p>
                  <p className="text-sm text-muted-foreground">{assessment.relation}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={assessment.status === "completed" ? "default" : "outline"}>
                    {assessment.status === "completed" ? "Concluído" : "Pendente"}
                  </Badge>
                  {assessment.completedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(assessment.completedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
