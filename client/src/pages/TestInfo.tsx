import { useState, useEffect } from "react";
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
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
  const [emailToCheck, setEmailToCheck] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const organizationsQuery = trpc.giftTest.organizations.useQuery();
  const organizations = organizationsQuery.data ?? [];

  // Query para verificar teste em andamento
  const checkInProgressQuery = trpc.giftTest.checkInProgressTest.useQuery(
    { email: emailToCheck },
    {
      enabled: isCheckingEmail && emailToCheck.length > 0,
      retry: false,
    }
  );

  // Processar resultado da verificação
  useEffect(() => {
    if (!isCheckingEmail) return;

    if (checkInProgressQuery.isSuccess) {
      setIsCheckingEmail(false);
      const data = checkInProgressQuery.data;
      
      if (data.hasInProgressTest) {
        setInProgressTest({
          testId: data.testId!,
          name: data.name!,
          selfAnswers: data.selfAnswers as number[],
          createdAt: new Date(data.createdAt!),
        });
        setShowContinueDialog(true);
      }
    }

    if (checkInProgressQuery.isError) {
      setIsCheckingEmail(false);
      // Sem teste em andamento, continua normalmente
      console.log("Nenhum teste em andamento encontrado");
    }
  }, [checkInProgressQuery.isSuccess, checkInProgressQuery.isError, isCheckingEmail]);

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

  // Verificar teste em andamento quando sair do campo email
  const handleEmailBlur = () => {
    const trimmedEmail = email.trim();
    
    // Validar email básico
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      return; // Não verifica se email inválido
    }

    // Verificar se existe teste em andamento
    setEmailToCheck(trimmedEmail);
    setIsCheckingEmail(true);
  };

  const handleContinueTest = () => {
    if (!inProgressTest) return;

    // Salvar informações no sessionStorage
    sessionStorage.setItem("currentTestId", inProgressTest.testId.toString());
    sessionStorage.setItem("testMaritalStatus", maritalStatus);
    sessionStorage.setItem("testOrganization", organization);

    // Salvar respostas no localStorage
    const storageKey = `giftTest_${inProgressTest.testId}_answers`;
    
    // Se selfAnswers for null/undefined, criar array vazio
    const answersToSave = Array.isArray(inProgressTest.selfAnswers) && inProgressTest.selfAnswers.length === 180
      ? inProgressTest.selfAnswers
      : new Array(180).fill(-1);
    
    localStorage.setItem(storageKey, JSON.stringify(answersToSave));

    // Calcular primeira pergunta não respondida
    const firstUnansweredIndex = answersToSave.findIndex(answer => answer === -1);
    const targetIndex = firstUnansweredIndex !== -1 ? firstUnansweredIndex : 0;
    
    // Salvar índice da pergunta para abrir
    sessionStorage.setItem("continueFromQuestion", targetIndex.toString());
    
    console.log('Continuando teste. Primeira não respondida:', targetIndex, 'Total respondidas:', answersToSave.filter(a => a !== -1).length);

    toast.success("Continuando teste anterior...");
    setLocation("/test/questions");
  };

  const deleteTestMutation = trpc.giftTest.deleteInProgressTest.useMutation({
    onSuccess: () => {
      toast.success("Teste anterior excluído. Iniciando novo teste...");
      setShowContinueDialog(false);
      setInProgressTest(null);
    },
    onError: (error) => {
      toast.error("Erro ao excluir teste anterior: " + error.message);
      setShowContinueDialog(false);
    },
  });

  const handleStartNewTest = () => {
    // Deletar teste anterior do banco
    if (inProgressTest) {
      // Limpar localStorage
      const storageKey = `giftTest_${inProgressTest.testId}_answers`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`giftTest_${inProgressTest.testId}_section`);
      localStorage.removeItem(`giftTest_${inProgressTest.testId}_question`);
      localStorage.removeItem(`giftTest_${inProgressTest.testId}_globalIndex`);

      // Deletar do banco
      deleteTestMutation.mutate({ testId: inProgressTest.testId });
    } else {
      setShowContinueDialog(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !trimmedName) {
      toast.error("Por favor, preencha email e nome");
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

    // Criar novo teste
    createTestMutation.mutate({
      name: trimmedName,
      email: trimmedEmail,
      organizationId: organizationId ?? undefined,
      organization: organization === "Nenhuma" ? null : organization,
    });
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
            {/* Email como primeiro campo */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                  disabled={isCheckingEmail}
                />
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                O resultado será enviado para este email. Verificaremos se você tem um teste em andamento.
              </p>
            </div>

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
                disabled={createTestMutation.isPending}
                className="flex-1"
              >
                {createTestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
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
