import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { EXTERNAL_ASSESSMENT_QUESTIONS, EXTERNAL_SCALE } from "@shared/testData";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ExternalCompletionDialog } from "@/components/ExternalCompletionDialog";

const TOTAL_QUESTIONS = 30;
const STORAGE_KEY_PREFIX = "externalAssessment_";

export default function ExternalAssessment() {
  const [, params] = useRoute("/external/:token");
  const token = params?.token || "";
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(TOTAL_QUESTIONS).fill(-1));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  const getByExternalTokenQuery = trpc.giftTest.getByExternalToken.useQuery(
    { token },
    { enabled: !!token }
  );

  const saveExternalAnswersMutation = trpc.giftTest.saveExternalAnswers.useMutation({
    onSuccess: () => {
      // Limpar localStorage e sessionStorage após finalizar
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${token}_answers`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${token}_question`);
      sessionStorage.removeItem(`externalToken_${token}`);
      sessionStorage.removeItem(`externalAssessment_${token}`);
      
      // Limpar todo cache relacionado ao token
      Object.keys(localStorage).forEach(key => {
        if (key.includes(token)) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes(token)) {
          sessionStorage.removeItem(key);
        }
      });
      
      toast.success("Avaliação concluída! Obrigado pela sua participação.");
      setLocation("/");
    },
    onError: (error) => {
      toast.error("Erro ao salvar respostas: " + error.message);
    },
  });

  // Carregar progresso do localStorage
  useEffect(() => {
    if (!token) return;

    const savedAnswers = localStorage.getItem(`${STORAGE_KEY_PREFIX}${token}_answers`);
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        setAnswers(parsed);
        toast.success("Progresso restaurado!");
      } catch (error) {
        console.error("Erro ao carregar progresso:", error);
      }
    }

    const savedQuestion = localStorage.getItem(`${STORAGE_KEY_PREFIX}${token}_question`);
    if (savedQuestion !== null) {
      setCurrentQuestion(parseInt(savedQuestion));
    }
  }, [token]);

  // Salvar progresso no localStorage sempre que as respostas mudarem
  useEffect(() => {
    if (token) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${token}_answers`, JSON.stringify(answers));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${token}_question`, currentQuestion.toString());
    }
  }, [answers, token, currentQuestion]);

  useEffect(() => {
    if (getByExternalTokenQuery.isError) {
      toast.error("Link inválido ou expirado");
      setLocation("/");
    }
  }, [getByExternalTokenQuery.isError, setLocation]);

  if (getByExternalTokenQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
          <p className="mt-4 text-gray-600">Carregando avaliação...</p>
        </div>
      </div>
    );
  }

  if (!getByExternalTokenQuery.data) {
    return null;
  }

  // Verificar se já foi respondido
  if (getByExternalTokenQuery.data.alreadyAnswered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-green-700">Avaliação Já Respondida</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-700">
              Este link de avaliação já foi respondido anteriormente.
            </p>
            <p className="text-sm text-gray-600">
              Cada link pode ser usado apenas uma vez para garantir a integridade dos resultados.
            </p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { name: assesseeName } = getByExternalTokenQuery.data;
  const questionText = EXTERNAL_ASSESSMENT_QUESTIONS[currentQuestion];
  const scale = EXTERNAL_SCALE;
  const currentAnswer = answers[currentQuestion];
  const totalProgress = answers.filter((a) => a !== -1).length;

  const handleAnswerSelect = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    // Trigger animação de "drop"
    setJustSelected(true);
    setTimeout(() => setJustSelected(false), 600);

    // Iniciar transição visual
    setIsTransitioning(true);

    // Auto-avançar para próxima pergunta após 1500ms (1,5 segundos)
    setTimeout(() => {
      setIsTransitioning(false);
      
      // Verificar se é a última pergunta e todas foram respondidas
      const isLastQuestion = currentQuestion === TOTAL_QUESTIONS - 1;
      const allAnswered = newAnswers.every((a) => a !== -1);
      
      if (isLastQuestion && allAnswered) {
        // Mostrar modal de conclusão
        setShowCompletionDialog(true);
      } else if (currentQuestion < TOTAL_QUESTIONS - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
    }, 1500);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentAnswer === -1) {
      toast.error("Por favor, selecione uma resposta antes de continuar");
      return;
    }

    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleFinish = () => {
    const allAnswered = answers.every((a) => a !== -1);
    if (!allAnswered) {
      toast.error("Por favor, responda todas as perguntas antes de finalizar");
      return;
    }

    saveExternalAnswersMutation.mutate({
      token,
      answers,
    });
  };

  const handleCompletionContinue = () => {
    setShowCompletionDialog(false);
    handleFinish();
  };

  const isLastQuestion = currentQuestion === TOTAL_QUESTIONS - 1;
  const allAnswered = answers.every((a) => a !== -1);

  // Obter o texto da resposta selecionada
  const selectedOptionText = currentAnswer !== -1 
    ? scale.options.find((opt: any) => opt.value === currentAnswer)?.label.toUpperCase()
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Avaliação Externa de {assesseeName}
            </CardTitle>
            <p className="text-center text-green-50 mt-2">
              Responda com sinceridade sobre as características que você observa em {assesseeName}
            </p>
          </CardHeader>
        </Card>

        {/* Progresso */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Progresso</CardTitle>
                <span className="text-sm text-gray-600">
                  {totalProgress} / {TOTAL_QUESTIONS} respondidas
                </span>
              </div>
              <Progress value={(totalProgress / TOTAL_QUESTIONS) * 100} className="h-2" />
              <div className="text-sm text-gray-600 text-center">
                Pergunta {currentQuestion + 1} de {TOTAL_QUESTIONS}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Card da pergunta com resposta dinâmica */}
        <Card className={`border-2 border-green-200 transition-all duration-500 ${
          isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100"
        }`}>
          <CardContent className="pt-8 pb-8 space-y-6">
            {/* Frase com resposta substituída */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 min-h-[160px] flex items-center justify-center">
              <p className="text-xl md:text-2xl text-center leading-relaxed text-gray-800">
                {scale.prefix && <span>{scale.prefix.replace("{name}", assesseeName)} </span>}
                {selectedOptionText ? (
                  <span 
                    className={`font-bold text-white bg-green-600 px-3 py-1 rounded-md mx-1 inline-block ${
                      justSelected ? 'animate-[dropIn_0.6s_ease-out]' : ''
                    }`}
                    style={{
                      boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3), 0 2px 4px -1px rgba(5, 150, 105, 0.2)'
                    }}
                  >
                    {selectedOptionText}
                  </span>
                ) : (
                  <span className="font-bold text-green-600 mx-1 px-2 py-1 border-2 border-dashed border-green-400 rounded-md inline-block bg-green-100/50">
                    ...
                  </span>
                )}
                {scale.suffix && <span> {scale.suffix} </span>}
                {questionText}
              </p>
            </div>

            {/* Opções de resposta como botões grandes */}
            <div className="space-y-3 mt-8">
              {scale.options.map((option: any) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswerSelect(option.value)}
                  disabled={isTransitioning}
                  className={`w-full p-4 rounded-lg text-left transition-all duration-200 ${
                    isTransitioning ? "cursor-not-allowed opacity-50" : ""} ${
                    currentAnswer === option.value
                      ? "bg-green-600 text-white shadow-lg scale-[1.02]"
                      : "bg-white hover:bg-green-50 hover:border-green-300 border-2 border-gray-200 text-gray-700"
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
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
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
            disabled={currentQuestion === 0}
            className="flex-1"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleFinish}
              disabled={!allAnswered || saveExternalAnswersMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {saveExternalAnswersMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Finalizar Avaliação"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentAnswer === -1}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Próxima
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Dica */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Dica:</strong> Responda com base no que você observa em {assesseeName}.
            Seu progresso é salvo automaticamente - você pode recarregar a página sem perder suas respostas.
          </p>
        </div>
      </div>

      {/* Modal de conclusão */}
      <ExternalCompletionDialog
        open={showCompletionDialog}
        assesseeName={assesseeName}
        onContinue={handleCompletionContinue}
      />

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
