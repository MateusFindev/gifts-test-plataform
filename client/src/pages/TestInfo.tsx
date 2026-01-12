import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ContinueTestDialog } from "@/components/ContinueTestDialog";

export default function TestInfo() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [alternateEmail, setAlternateEmail] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<"single" | "married">("single");
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [inProgressTest, setInProgressTest] = useState<{
    testId: number;
    name: string;
    selfAnswers: number[];
    createdAt: Date;
  } | null>(null);

  const organizationsQuery = trpc.giftTest.organizations.useQuery();
  const organizations = organizationsQuery.data ?? [];

  const checkInProgressMutation = trpc.giftTest.checkInProgressTest.useMutation({
    onSuccess: (data) => {
      if (data.hasInProgressTest) {
        setInProgressTest({
          testId: data.testId!,
          name: data.name!,
          selfAnswers: data.selfAnswers as number[],
          createdAt: new Date(data.createdAt!),
        });
        setShowContinueDialog(true);
      } else {
        // Não há teste em andamento, criar novo
        proceedWithNewTest();
      }
    },
    onError: (error) => {
      // Se não encontrar teste, criar novo
      console.log("Nenhum teste em andamento encontrado:", error.message);
      proceedWithNewTest();
    },
  });

  const createTestMutation = trpc.giftTest.create.useMutation({
    onSuccess: (data) => {
      sessionStorage.setItem("currentTestId", data.testId.toString());
      toast.success("Teste criado com sucesso!");
      setLocation("/test/questions");
    },
    onError: (error) => {
      toast.error("Erro ao criar teste: " + error.message);
    },
  });

  const proceedWithNewTest = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    createTestMutation.mutate({
      name: trimmedName,
      email: trimmedEmail,
      organizationId: organizationId ?? undefined,
      organization: organization === "Nenhuma" ? null : organization,
    });
  };

  const handleContinueTest = () => {
    if (!inProgressTest) return;

    // Salvar informações no sessionStorage
    sessionStorage.setItem("currentTestId", inProgressTest.testId.toString());
    sessionStorage.setItem("testMaritalStatus", maritalStatus);
    sessionStorage.setItem("testOrganization", organization);

    // Salvar respostas no localStorage
    const storageKey = `giftTest_${inProgressTest.testId}_answers`;
    localStorage.setItem(storageKey, JSON.stringify(inProgressTest.selfAnswers));

    toast.success("Continuando teste anterior...");
    setLocation("/test/questions");
  };

  const handleStartNewTest = () => {
    setShowContinueDialog(false);
    
    // Limpar localStorage do teste anterior se existir
    if (inProgressTest) {
      const storageKey = `giftTest_${inProgressTest.testId}_answers`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`giftTest_${inProgressTest.testId}_section`);
      localStorage.removeItem(`giftTest_${inProgressTest.testId}_question`);
      localStorage.removeItem(`giftTest_${inProgressTest.testId}_globalIndex`);
    }

    proceedWithNewTest();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      toast.error("Por favor, preencha nome e email");
      return;
    }

    if (!organizationId && organization !== "Nenhuma") {
      toast.error("Por favor, selecione uma organização");
      return;
    }

    const trimmedAlternateEmail = alternateEmail.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (organization === "Nenhuma" && trimmedAlternateEmail && !emailPattern.test(trimmedAlternateEmail)) {
      toast.error("Informe um email válido para compartilhar o resultado");
      return;
    }

    sessionStorage.setItem("testMaritalStatus", maritalStatus);
    sessionStorage.setItem("testOrganization", organization);

    if (trimmedAlternateEmail) {
      sessionStorage.setItem("testAlternateResultEmail", trimmedAlternateEmail);
    } else {
      sessionStorage.removeItem("testAlternateResultEmail");
    }

    // Verificar se existe teste em andamento
    checkInProgressMutation.mutate({ email: trimmedEmail });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl">Informações do Teste</CardTitle>
          <CardDescription className="text-base">
            Preencha suas informações para iniciar o teste de dons espirituais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                O resultado será enviado para este email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organização *</Label>
              <Select
                value={organization || undefined}
                onValueChange={(value) => {
                  setOrganization(value);

                  if (value === "Nenhuma") {
                    setOrganizationId(null);
                    return;
                  }

                  const org = organizations.find(
                    (o) => o.name === value
                  );

                  setOrganizationId(org ? org.id : null);
                }}
                disabled={organizationsQuery.isLoading || organizationsQuery.isError}
              >
                <SelectTrigger id="organization">
                  <SelectValue
                    placeholder={
                      organizationsQuery.isLoading
                        ? "Carregando organizações..."
                        : "Selecione uma organização"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.name}>
                      {org.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                </SelectContent>
              </Select>
              {organizationsQuery.isError && (
                <p className="text-xs text-red-500 mt-1">
                  Erro ao carregar organizações. Tente novamente mais tarde.
                </p>
              )}
            </div>

            {organization === "Nenhuma" && (
              <div className="space-y-2">
                <Label htmlFor="alternateEmail">Email adicional para compartilhar o resultado</Label>
                <Input
                  id="alternateEmail"
                  type="email"
                  placeholder="email@lider.com"
                  value={alternateEmail}
                  onChange={(e) => setAlternateEmail(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Informe um email se desejar enviar o resultado para outra pessoa além de você.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Estado civil *</Label>
              <RadioGroup
                value={maritalStatus}
                onValueChange={(value) => setMaritalStatus(value as "single" | "married")}
                className="grid gap-2 sm:grid-cols-2"
              >
                <div className="flex items-center space-x-2 rounded-lg border border-gray-200 p-3">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="font-medium leading-none">
                    Solteiro(a)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border border-gray-200 p-3">
                  <RadioGroupItem value="married" id="married" />
                  <Label htmlFor="married" className="font-medium leading-none">
                    Casado(a)
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-gray-500">
                Essa informação é usada para ocultar perguntas sobre celibato caso você seja casado(a).
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Sobre o teste:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• 180 perguntas divididas em 6 seções</li>
                <li>• Tempo estimado: 30-40 minutos</li>
                <li>• Você pode pausar e retomar a qualquer momento</li>
                <li>• Após concluir, você gerará links para 2 pessoas próximas responderem</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={createTestMutation.isPending || checkInProgressMutation.isPending}
                className="flex-1"
              >
                {(createTestMutation.isPending || checkInProgressMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Iniciar Teste"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {inProgressTest && (
        <ContinueTestDialog
          open={showContinueDialog}
          onContinue={handleContinueTest}
          onStartNew={handleStartNewTest}
          testName={inProgressTest.name}
          createdAt={inProgressTest.createdAt}
        />
      )}
    </div>
  );
}
