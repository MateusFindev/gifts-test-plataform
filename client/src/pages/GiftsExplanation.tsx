import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ChevronDown, ChevronUp, Home, BookOpen } from "lucide-react";
import giftsExplanations from "@shared/giftsExplanations.json";

// Mapeamento de cores para classes Tailwind
const colorClasses: Record<string, { bg: string; border: string; text: string; badge: string; categoryBg: string }> = {
  green: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-700",
    badge: "bg-green-500",
    categoryBg: "bg-gradient-to-r from-green-100 to-emerald-100"
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    badge: "bg-red-500",
    categoryBg: "bg-gradient-to-r from-red-100 to-rose-100"
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    badge: "bg-blue-500",
    categoryBg: "bg-gradient-to-r from-blue-100 to-cyan-100"
  }
};

// Descrições das categorias
const categoryDescriptions: Record<string, { title: string; description: string; subcategories: string[] }> = {
  green: {
    title: "🟩 Categoria Verde - Revelação de Deus na Criação",
    description: "Os dons listados na categoria verde estão relacionados principalmente com a revelação de Deus na criação. Essa é a razão pela qual dons dessa categoria são frequentemente encontrados fora do contexto cristão. Mas, no momento em que são usados para o Reino de Deus, eles se transformam em dons espirituais.",
    subcategories: [
      "Engajamento social – dons voltados ao serviço ao próximo: Generosidade, Hospitalidade, Misericórdia, Pobreza Voluntária",
      "Compreensão humana e vontade de Deus – dons voltados ao discernimento: Conhecimento, Organização, Sabedoria",
      "Atividades criativas – dons voltados à expressão artística: Criatividade Artística, Habilidade Manual, Música"
    ]
  },
  red: {
    title: "🔴 Categoria Vermelha - Pregação do Evangelho e Liderança",
    description: "Os dons listados na categoria vermelha estão relacionados com a pregação do Evangelho e com ajudar pessoas a crescerem na fé. Essa categoria reúne dons que capacitam pessoas a exercerem papéis de liderança na igreja.",
    subcategories: [
      "Propagação do Evangelho: Evangelização, Missionário",
      "Dons de liderança: Apóstolo, Aconselhamento, Liderança, Pastoral, Ensino",
      "Dons de apoio aos líderes: Ajuda, Serviço, Celibato"
    ]
  },
  blue: {
    title: "🟦 Categoria Azul - Poder Sobrenatural de Deus",
    description: "Os dons listados na área azul demonstram o poder sobrenatural de Deus. Muitos transcendem as leis naturais, mostrando o poder de Deus sobre a criação e servindo pessoas de maneira sobrenatural.",
    subcategories: [
      "Confiança incondicional em Deus: Fé, Oração, Sofrimento",
      "Mensagens recebidas de Deus: Discernimento, Interpretação, Profecia, Línguas",
      "Poder sobrenatural para necessidades especiais: Libertação, Cura, Milagres"
    ]
  }
};

export default function GiftsExplanation() {
  const [, setLocation] = useLocation();
  const [expandedGift, setExpandedGift] = useState<string | null>(null);

  const toggleGift = (giftName: string) => {
    setExpandedGift(expandedGift === giftName ? null : giftName);
  };

  // Agrupar dons por categoria (já estão ordenados no JSON)
  const greenGifts = giftsExplanations.slice(0, 10);
  const redGifts = giftsExplanations.slice(10, 20);
  const blueGifts = giftsExplanations.slice(20, 30);

  const renderCategory = (categoryKey: string, gifts: any[]) => {
    const category = categoryDescriptions[categoryKey];
    const colors = colorClasses[categoryKey];

    return (
      <div key={categoryKey} className="space-y-4">
        {/* Cabeçalho da Categoria */}
        <Card className={`${colors.categoryBg} border-2 ${colors.border}`}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{category.title}</CardTitle>
            <CardDescription className="text-base text-gray-800 mt-2">
              {category.description}
            </CardDescription>
            <div className="mt-4 space-y-2">
              <p className="font-semibold text-gray-900">Subgrupos:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {category.subcategories.map((sub, idx) => (
                  <li key={idx}>{sub}</li>
                ))}
              </ul>
            </div>
          </CardHeader>
        </Card>

        {/* Dons da Categoria */}
        <div className="grid gap-3">
          {gifts.map((gift: any) => {
            const isExpanded = expandedGift === gift.name;

            return (
              <Card
                key={gift.name}
                className={`border-2 ${colors.border} ${colors.bg} transition-all hover:shadow-md cursor-pointer`}
                onClick={() => toggleGift(gift.name)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors.badge}`} />
                      <CardTitle className={`text-xl ${colors.text}`}>{gift.name}</CardTitle>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className={`h-5 w-5 ${colors.text}`} />
                    ) : (
                      <ChevronDown className={`h-5 w-5 ${colors.text}`} />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Definição:</h4>
                      <p className="text-gray-700">{gift.definition}</p>
                    </div>

                    {gift.biblicalReference && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Referência Bíblica:</h4>
                        <p className="text-gray-700">{gift.biblicalReference}</p>
                      </div>
                    )}

                    {gift.tasks && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Tarefas Possíveis:</h4>
                        <p className="text-gray-700">{gift.tasks}</p>
                      </div>
                    )}

                    {gift.dangers && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Perigos:</h4>
                        <p className="text-gray-700">{gift.dangers}</p>
                      </div>
                    )}

                    {gift.tips && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Dicas:</h4>
                        <p className="text-gray-700">{gift.tips}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div>
                  <CardTitle className="text-2xl">Conheça os 30 Dons Espirituais</CardTitle>
                  <CardDescription className="mt-2">
                    Explore os dons espirituais organizados por categoria
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Início
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Introdução */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Os dons espirituais são capacidades especiais dadas por Deus para edificar a igreja e servir ao próximo.
              Cada dom tem características únicas, tarefas específicas e também desafios a serem superados.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Os 30 dons estão organizados em <strong>3 categorias</strong> representadas por cores:
              🟩 Verde (Revelação de Deus na Criação), 🔴 Vermelho (Pregação e Liderança) e 🟦 Azul (Poder Sobrenatural).
            </p>
            <p className="text-sm text-gray-600 italic">
              Clique em cada dom para ver sua definição, referências bíblicas, tarefas possíveis, perigos e dicas.
            </p>
          </CardContent>
        </Card>

        {/* Categorias */}
        {renderCategory("green", greenGifts)}
        {renderCategory("red", redGifts)}
        {renderCategory("blue", blueGifts)}

        {/* Rodapé */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => setLocation("/")}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
          >
            Voltar para Início
          </Button>
        </div>
      </div>
    </div>
  );
}
