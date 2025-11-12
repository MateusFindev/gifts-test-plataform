import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE } from "@/const";
import { useLocation } from "wouter";
import { ClipboardList, Search, BookOpen } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            {APP_TITLE}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra seus dons espirituais através de uma avaliação completa que combina
            autoavaliação e percepção de pessoas próximas.
          </p>
        </div>

        {/* Card destacado para Conheça os Dons */}
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-2xl transition-all cursor-pointer transform hover:scale-[1.02]" onClick={() => setLocation("/gifts-explanation")}>
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-3">
              <BookOpen className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Conheça os 30 Dons Espirituais</h2>
            </div>
            <p className="text-center mt-2 text-purple-100">
              Entenda cada dom com definições, referências bíblicas e dicas práticas
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/test/info")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Novo Teste</CardTitle>
              </div>
              <CardDescription className="text-base mt-2">
                Inicie uma nova avaliação de dons espirituais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                O teste completo inclui 180 perguntas de autoavaliação divididas em 6 seções,
                além de avaliações de duas pessoas que te conhecem bem.
              </p>
              <Button className="w-full" size="lg">
                Começar Teste
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/check-result")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Consultar Resultado</CardTitle>
              </div>
              <CardDescription className="text-base mt-2">
                Acesse o resultado de um teste já realizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Digite o email usado no teste para visualizar seus dons manifestos e latentes.
                O resultado também foi enviado por email.
              </p>
              <Button className="w-full" variant="outline" size="lg">
                Consultar
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Baseado no estudo de <strong className="text-gray-900">Desenvolvimento Natural da Igreja</strong> de{" "}
              <strong className="text-gray-900">Christian A. Schwarz</strong>
            </p>
          </div>
          <h2 className="text-xl font-semibold mb-3 text-gray-900">Como funciona?</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
              <span>Preencha suas informações básicas (nome, email e organização)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
              <span>Responda 180 perguntas divididas em 6 seções sobre suas experiências e sentimentos</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
              <span>Compartilhe links com duas pessoas próximas para que respondam 30 perguntas sobre você</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
              <span>Receba seu resultado por email identificando seus Dons Manifestos e Dons Latentes</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">5.</span>
              <span>Apresente o resultado do teste ao seu líder ministerial para planejar próximos passos</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Rodapé com logo da Control Fin Solutions */}
      <footer className="mt-12 pb-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-600">Desenvolvido por</p>
          <img 
            src="/controlfin-logo.png" 
            alt="Control Fin Solutions" 
            className="h-20 opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
      </footer>
    </div>
  );
}
