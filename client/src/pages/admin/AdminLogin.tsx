import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { ShieldCheck, Users, Sparkles, ArrowLeft } from "lucide-react";

const featureList = [
  {
    icon: ShieldCheck,
    title: "Segurança Multi-tenant",
    description: "Cada organização acessa apenas seus próprios resultados e métricas.",
  },
  {
    icon: Users,
    title: "Papéis e Permissões",
    description: "Convide administradores e defina o nível de acesso em minutos.",
  },
  {
    icon: Sparkles,
    title: "Dashboards com Insights",
    description: "Acompanhe a distribuição de dons e o engajamento em tempo real.",
  },
];

export default function AdminLogin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitCredentials = async () => {
    setErrorMessage(null);
    if (!formState.email || !formState.password) {
      setErrorMessage("Informe email e senha para continuar.");
      return;
    }
    try {
      await loginMutation.mutateAsync({
        email: formState.email,
        password: formState.password,
      });
      await utils.auth.me.invalidate();
      setLocation("/admin/dashboard");
    } catch (error: unknown) {
      if (error instanceof TRPCClientError) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage("Não foi possível realizar o login. Tente novamente.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitCredentials();
  };

  useEffect(() => {
    if (!loading && user) {
      setLocation("/admin/dashboard");
    }
  }, [loading, setLocation, user]);

  const isSubmitting = loginMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a página inicial
        </Button>
      </div>
      <div className="max-w-4xl w-full grid gap-8 lg:grid-cols-2">
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-14 w-14 rounded-xl object-cover" />
              <div>
                <p className="text-sm text-muted-foreground">Plataforma Administrativa</p>
                <CardTitle className="text-3xl font-semibold">{APP_TITLE}</CardTitle>
              </div>
            </div>
            <p className="text-muted-foreground text-base">
              Acesse sua conta para gerenciar organizações, acompanhar o progresso dos testes e visualizar insights sobre os dons espirituais.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@exemplo.com"
                    value={formState.email}
                    autoComplete="username"
                    onChange={event =>
                      setFormState(prev => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={formState.password}
                    autoComplete="current-password"
                    onChange={event =>
                      setFormState(prev => ({ ...prev, password: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              <Button size="lg" className="w-full text-base" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Entrando..." : "Acessar Painel"
                }
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white shadow-2xl flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl">Recursos Principais</CardTitle>
            <p className="text-slate-300">
              Uma plataforma completa para gestão de testes de dons espirituais.
            </p>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-center">
            <div className="space-y-6">
              {featureList.map(feature => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-primary">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{feature.title}</p>
                    <p className="text-sm text-slate-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
