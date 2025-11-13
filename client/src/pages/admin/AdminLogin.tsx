import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users, Sparkles } from "lucide-react";

const featureList = [
  {
    icon: ShieldCheck,
    title: "Segurança multi-tenant",
    description: "Cada organização acessa apenas seus resultados e métricas.",
  },
  {
    icon: Users,
    title: "Papéis e permissões",
    description: "Convide administradores e defina o nível de acesso em minutos.",
  },
  {
    icon: Sparkles,
    title: "Fluxo completo do teste",
    description: "Links públicos, aprovação externa e dashboards com insights.",
  },
];

export default function AdminLogin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/admin/dashboard");
    }
  }, [loading, setLocation, user]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-6">
            <div className="flex items-center gap-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-14 w-14 rounded-xl object-cover" />
              <div>
                <p className="text-sm text-muted-foreground">Plataforma administrativa</p>
                <CardTitle className="text-3xl font-semibold">{APP_TITLE}</CardTitle>
              </div>
            </div>
            <p className="text-muted-foreground text-base">
              Centralize organizações, acompanhe o progresso das respostas e visualize insights sobre dons espirituais em poucos cliques.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Multi-tenant</Badge>
              <Badge variant="secondary">RBAC</Badge>
              <Badge variant="secondary">Dashboards em tempo real</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              size="lg"
              className="w-full text-base"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
            >
              Acessar área administrativa
            </Button>
            <div className="grid gap-4 md:grid-cols-3">
              {featureList.map(feature => (
                <div key={feature.title} className="flex flex-col gap-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                      {feature.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Como funciona?</CardTitle>
            <p className="text-slate-200">
              Convide sua organização, gere links públicos ou direcionados e acompanhe cada etapa do processo.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  1
                </span>
                <div>
                  <p className="font-semibold">Cadastre a organização</p>
                  <p className="text-sm text-slate-200">Configure papéis de acesso para cada líder.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  2
                </span>
                <div>
                  <p className="font-semibold">Disponibilize o teste</p>
                  <p className="text-sm text-slate-200">Envie links públicos ou códigos exclusivos.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  3
                </span>
                <div>
                  <p className="font-semibold">Acompanhe e compartilhe insights</p>
                  <p className="text-sm text-slate-200">Dashboards mostram a distribuição dos dons e engajamento.</p>
                </div>
              </li>
            </ol>
            <div className="rounded-2xl bg-slate-800 p-4 space-y-3">
              <p className="text-sm text-slate-300">Pronto para começar?</p>
              <Button
                variant="secondary"
                className="w-full bg-white text-slate-900 hover:bg-slate-100"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                Entrar com minha conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
