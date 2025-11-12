import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SELF_ASSESSMENT_QUESTIONS, SECTION_SCALES } from "@shared/testData";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const QUESTIONS_PER_SECTION = 30;
const TOTAL_SECTIONS = 6;
const STORAGE_KEY_PREFIX = "giftTest_";

export default function TestQuestions() {
  const [, setLocation] = useLocation();
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(180).fill(-1));
  const [testId, setTestId] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [justSelected, setJustSelected] = useState(false);

  // Carregar progresso do localStorage
  useEffect(() => {
    const storedTestId = sessionStorage.getItem("currentTestId");
    if (!storedTestId) {
      toast.error("Teste não encontrado. Redirecionando...");
      setLocation("/test/info");
      return;
    }
    
    const id = parseInt(storedTestId);
    setTestId(id);

    // Carregar respostas salvas do localStorage
    const storageKey = `${STORAGE_KEY_PREFIX}${id}_answers`;
    const savedAnswers = localStorage.getItem(storageKey);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        setAnswers(parsed);
        toast.success("Progresso restaurado!");
      } catch (error) {
        console.error("Erro ao carregar progresso:", error);
      }
    }

    // Carregar posição atual
    const savedSection = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}_section`);
    const savedQuestion = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}_question`);
    if (savedSection !== null) setCurrentSection(parseInt(savedSection));
    if (savedQuestion !== null) setCurrentQuestion(parseInt(savedQuestion));
  }, [setLocation]);

  // Salvar progresso no localStorage sempre que as respostas mudarem
  useEffect(() => {
    if (testId !== null) {
      const storageKey = `${STORAGE_KEY_PREFIX}${testId}_answers`;
      localStorage.setItem(storageKey, JSON.stringify(answers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${testId}_section`, currentSection.toString());
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${testId}_question`, currentQuestion.toString());
    }
  }, [answers, testId, currentSection, currentQuestion]);

  const saveSelfAnswersMutation = trpc.giftTest.saveSelfAnswers.useMutation({
    onSuccess: (data) => {
      sessionStorage.setItem("externalToken1", data.token1);
      sessionStorage.setItem("externalToken2", data.token2);
      
      // Limpar localStorage após finalizar
      if (testId !== null) {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${testId}_answers`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${testId}_section`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${testId}_question`);
      }
      
      toast.success("Respostas salvas com sucesso!");
      setLocation("/test/external-links");
    },
    onError: (error) => {
      toast.error("Erro ao salvar respostas: " + error.message);
    },
  });

  const globalQuestionIndex = currentSection * QUESTIONS_PER_SECTION + currentQuestion;
  const questionText = SELF_ASSESSMENT_QUESTIONS[globalQuestionIndex];
  const scale = SECTION_SCALES[currentSection];
  const currentAnswer = answers[globalQuestionIndex];

  const totalProgress = answers.filter((a) => a !== -1).length;
  const sectionProgress = answers
    .slice(currentSection * QUESTIONS_PER_SECTION, (currentSection + 1) * QUESTIONS_PER_SECTION)
    .filter((a) => a !== -1).length;

  const handleAnswerSelect = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[globalQuestionIndex] = value;
    setAnswers(newAnswers);

    // Trigger animação de "drop"
    setJustSelected(true);
    setTimeout(() => setJustSelected(false), 600);

    // Iniciar transição visual
    setIsTransitioning(true);

    // Auto-avançar para próxima pergunta após 1500ms (1,5 segundos)
    setTimeout(() => {
      setIsTransitioning(false);
      if (currentQuestion < QUESTIONS_PER_SECTION - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else if (currentSection < TOTAL_SECTIONS - 1) {
        setCurrentSection(currentSection + 1);
        setCurrentQuestion(0);
        window.scrollTo(0, 0);
      }
    }, 1500);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentQuestion(QUESTIONS_PER_SECTION - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleNext = () => {
    if (currentAnswer === -1) {
      toast.error("Por favor, selecione uma resposta antes de continuar");
      return;
    }

    if (currentQuestion < QUESTIONS_PER_SECTION - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < TOTAL_SECTIONS - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
      window.scrollTo(0, 0);
    }
  };

  const handleFinish = () => {
    const allAnswered = answers.every((a) => a !== -1);
    if (!allAnswered) {
      toast.error("Por favor, responda todas as perguntas antes de finalizar");
      return;
    }

    if (!testId) {
      toast.error("ID do teste não encontrado");
      return;
    }

    saveSelfAnswersMutation.mutate({
      testId,
      answers,
    });
  };

  const isLastSection = currentSection === TOTAL_SECTIONS - 1;
  const isLastQuestion = currentQuestion === QUESTIONS_PER_SECTION - 1;
  const allAnswered = answers.every((a) => a !== -1);

  // Obter o texto da resposta selecionada
  const selectedOptionText = currentAnswer !== -1 
    ? scale.options.find(opt => opt.value === currentAnswer)?.label.toUpperCase()
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header com progresso */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  Seção {currentSection + 1} de {TOTAL_SECTIONS}
                </CardTitle>
                <span className="text-sm text-gray-600">
                  {totalProgress} / 180 respondidas
                </span>
              </div>
              <Progress value={(totalProgress / 180) * 100} className="h-2" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Pergunta {currentQuestion + 1} de {QUESTIONS_PER_SECTION}</span>
                <span>{sectionProgress} / {QUESTIONS_PER_SECTION} nesta seção</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Card da pergunta com resposta dinâmica */}
        <Card className={`border-2 border-blue-200 transition-all duration-500 ${
          isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100"
        }`}>
          <CardContent className="pt-8 pb-8 space-y-6">
            {/* Frase com resposta substituída */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 min-h-[160px] flex items-center justify-center">
              <p className="text-xl md:text-2xl text-center leading-relaxed text-gray-800">
                {scale.prefix && <span>{scale.prefix} </span>}
                {selectedOptionText ? (
                  <span 
                    className={`font-bold text-white bg-blue-600 px-3 py-1 rounded-md mx-1 inline-block ${
                      justSelected ? 'animate-[dropIn_0.6s_ease-out]' : ''
                    }`}
                    style={{
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3), 0 2px 4px -1px rgba(37, 99, 235, 0.2)'
                    }}
                  >
                    {selectedOptionText}
                  </span>
                ) : (
                  <span className="font-bold text-blue-600 mx-1 px-2 py-1 border-2 border-dashed border-blue-400 rounded-md inline-block bg-blue-100/50">
                    ...
                  </span>
                )}
                {scale.suffix && <span> {scale.suffix} </span>}
                {questionText}
              </p>
            </div>

            {/* Opções de resposta como botões grandes */}
            <div className="space-y-3 mt-8">
              {scale.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswerSelect(option.value)}
                  disabled={isTransitioning}
                  className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                    isTransitioning ? "cursor-not-allowed opacity-50" : ""} ${
                    currentAnswer === option.value
                      ? "bg-blue-600 text-white shadow-lg scale-[1.02]"
                      : "bg-white hover:bg-blue-50 hover:border-blue-300 border-2 border-gray-200 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        currentAnswer === option.value
                          ? "border-white bg-white"
                          : "border-gray-300"
                      }`}
                    >
                      {currentAnswer === option.value && (
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <span className="text-base font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSection === 0 && currentQuestion === 0}
            className="flex-1"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {isLastSection && isLastQuestion ? (
            <Button
              onClick={handleFinish}
              disabled={!allAnswered || saveSelfAnswersMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {saveSelfAnswersMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Finalizar Autoavaliação"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentAnswer === -1}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Próxima
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Dica */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Dica:</strong> Responda com sinceridade. Não há respostas certas ou erradas.
            Seu progresso é salvo automaticamente - você pode recarregar a página sem perder suas respostas.
          </p>
        </div>
      </div>

      {/* Keyframes CSS para animação de drop */}
      <style>{`
        @keyframes dropIn {
          0% {
            transform: translateY(-20px) scale(0.8);
            opacity: 0;
          }
          60% {
            transform: translateY(5px) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
