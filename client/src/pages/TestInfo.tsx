import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function TestInfo() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast.error("Por favor, preencha nome e email");
      return;
    }

    createTestMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      organization: organization.trim() || undefined,
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
              <Label htmlFor="organization">Organização (opcional)</Label>
              <Input
                id="organization"
                type="text"
                placeholder="Nome da sua igreja ou organização"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
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
    </div>
  );
}
