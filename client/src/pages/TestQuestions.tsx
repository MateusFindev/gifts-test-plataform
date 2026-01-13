import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SELF_ASSESSMENT_QUESTIONS, SECTION_SCALES } from "@shared/testData";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { CompletionDialog } from "@/components/CompletionDialog";

const QUESTIONS_PER_SECTION = 30;
const TOTAL_SECTIONS = 6;
const HIDDEN_CELIBACY_QUESTION_INDEXES = [2, 32, 62, 122, 152] as const;
const HIDDEN_CELIBACY_SET = new Set<number>(HIDDEN_CELIBACY_QUESTION_INDEXES);
const EMPTY_SET = new Set<number>();
const STORAGE_KEY_PREFIX = "giftTest_";
const AUTOSAVE_INTERVAL = 30000; // 30 segundos

export default function TestQuestions() {
  const [, setLocation] = useLocation();
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(180).fill(-1));
  const [testId, setTestId] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState<"single" | "married">("single");
  const [hasInitializedPosition, setHasInitializedPosition] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [answersLoaded, setAnswersLoaded] = useState(false);
  const savedPositionRef = useRef<number | null>(null);
  const lastSavedAnswersRef = useRef<string>("");

  const baseSectionIndexes = useMemo(
    () =>
      Array.from({ length: TOTAL_SECTIONS }, (_, sectionIndex) =>
        Array.from({ length: QUESTIONS_PER_SECTION }, (_, questionIndex) => sectionIndex * QUESTIONS_PER_SECTION + questionIndex)
      ),
    []
  );

  const hiddenIndexes = useMemo(() => (maritalStatus === "married" ? HIDDEN_CELIBACY_SET : EMPTY_SET), [maritalStatus]);

  const visibleQuestionIndexes = useMemo(
    () => baseSectionIndexes.map(section => section.filter(index => !hiddenIndexes.has(index))),
    [baseSectionIndexes, hiddenIndexes]
  );

  const flattenedVisibleQuestions = useMemo(() => visibleQuestionIndexes.flat(), [visibleQuestionIndexes]);

  // Guard: verificar se arrays estão inicializados
  const isInitialized = useMemo(() => {
    return (
      visibleQuestionIndexes.length > 0 &&
      visibleQuestionIndexes[currentSection] !== undefined &&
      visibleQuestionIndexes[currentSection] !== null &&
      Array.isArray(visibleQuestionIndexes[currentSection])
    );
  }, [visibleQuestionIndexes, currentSection]);

  const currentSectionQuestions = isInitialized ? visibleQuestionIndexes[currentSection] : [];
  const globalQuestionIndex = currentSectionQuestions.length > 0 && currentQuestion < currentSectionQuestions.length
    ? currentSectionQuestions[currentQuestion]
    : 0;
  const questionText =
    globalQuestionIndex !== undefined && SELF_ASSESSMENT_QUESTIONS[globalQuestionIndex]
      ? SELF_ASSESSMENT_QUESTIONS[globalQuestionIndex]
      : "";
  const scale = SECTION_SCALES[currentSection] ?? SECTION_SCALES[0];
  const currentAnswer = globalQuestionIndex !== undefined && answers[globalQuestionIndex] !== undefined
    ? answers[globalQuestionIndex]
    : -1;

  const totalVisibleQuestions = flattenedVisibleQuestions.length;
  const totalProgress = flattenedVisibleQuestions.filter(index => answers[index] !== -1).length;
  const totalProgressPercentage = totalVisibleQuestions > 0 ? (totalProgress / totalVisibleQuestions) * 100 : 0;

  // Mutation para salvar progresso no banco
  const saveProgressMutation = trpc.giftTest.saveProgress.useMutation({
    onError: (error) => {
      console.error("Erro ao salvar progresso:", error);
    },
  });

  // Carregar progresso do localStorage e banco
  useEffect(() => {
    const storedStatus = sessionStorage.getItem("testMaritalStatus");
    if (storedStatus === "married" || storedStatus === "single") {
      setMaritalStatus(storedStatus);
    }

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
    if (savedAnswers && savedAnswers !== "null" && savedAnswers !== "undefined") {
      try {
        const parsed = JSON.parse(savedAnswers);
        // Validar se é realmente um array válido com 180 elementos
        if (Array.isArray(parsed) && parsed.length === 180) {
          setAnswers(parsed);
          lastSavedAnswersRef.current = savedAnswers;
          setAnswersLoaded(true);
          toast.success("Progresso restaurado!");
        } else {
          console.warn("Progresso inválido no localStorage, iniciando do zero");
          // Limpar localStorage inválido
          localStorage.removeItem(storageKey);
          setAnswersLoaded(true);
        }
      } catch (error) {
        console.error("Erro ao carregar progresso:", error);
        // Limpar localStorage corrompido
        localStorage.removeItem(storageKey);
        setAnswersLoaded(true);
      }
    } else {
      // Não tem dados salvos, iniciar do zero
      setAnswersLoaded(true);
    }

    const savedGlobalIndex = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}_globalIndex`);
    if (savedGlobalIndex !== null) {
      savedPositionRef.current = parseInt(savedGlobalIndex);
      return;
    }

    const savedSection = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}_section`);
    const savedQuestion = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}_question`);
    if (savedSection !== null && savedQuestion !== null) {
      savedPositionRef.current = parseInt(savedSection) * QUESTIONS_PER_SECTION + parseInt(savedQuestion);
    }
  }, [setLocation]);

  // Salvar progresso no localStorage sempre que as respostas mudarem
  useEffect(() => {
    if (testId === null) {
      return;
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${testId}_answers`;
    localStorage.setItem(storageKey, JSON.stringify(answers));
    const fallbackGlobalIndex =
      globalQuestionIndex ??
      flattenedVisibleQuestions.find(index => answers[index] === -1) ??
      flattenedVisibleQuestions[flattenedVisibleQuestions.length - 1] ??
      0;
    const baseSectionForStorage = Math.floor(fallbackGlobalIndex / QUESTIONS_PER_SECTION);
    const baseQuestionForStorage = fallbackGlobalIndex % QUESTIONS_PER_SECTION;

    localStorage.setItem(`${STORAGE_KEY_PREFIX}${testId}_globalIndex`, fallbackGlobalIndex.toString());
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${testId}_section`, baseSectionForStorage.toString());
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${testId}_question`, baseQuestionForStorage.toString());
  }, [
    answers,
    testId,
    currentSection,
    currentQuestion,
    globalQuestionIndex,
    flattenedVisibleQuestions,
  ]);

  // Removido autosave de 30s - agora salva após cada resposta

  useEffect(() => {
    if (maritalStatus !== "married") {
      return;
    }

    setAnswers(prev => {
      let changed = false;
      const updated = [...prev];

      HIDDEN_CELIBACY_QUESTION_INDEXES.forEach(index => {
        if (updated[index] === -1) {
          updated[index] = 0;
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [maritalStatus]);

  useEffect(() => {
    setHasInitializedPosition(false);
  }, [maritalStatus]);

  useEffect(() => {
    if (hasInitializedPosition) {
      return;
    }

    if (!flattenedVisibleQuestions.length) {
      return;
    }

    // Aguardar answers carregar completamente
    if (!answersLoaded) {
      return;
    }

    let targetGlobalIndex: number;

    if (savedPositionRef.current !== null) {
      const saved = savedPositionRef.current;
      const candidate = flattenedVisibleQuestions.find(index => index >= saved);
      targetGlobalIndex = candidate ?? flattenedVisibleQuestions[flattenedVisibleQuestions.length - 1];
      savedPositionRef.current = null;
    } else {
      // Buscar primeira pergunta não respondida
      const firstUnanswered = flattenedVisibleQuestions.find(index => answers[index] === -1);
      targetGlobalIndex = firstUnanswered ?? flattenedVisibleQuestions[flattenedVisibleQuestions.length - 1];
    }

    let targetSection = 0;
    let targetQuestion = 0;

    visibleQuestionIndexes.some((sectionQuestions, sectionIndex) => {
      const questionIndex = sectionQuestions.indexOf(targetGlobalIndex);
      if (questionIndex !== -1) {
        targetSection = sectionIndex;
        targetQuestion = questionIndex;
        return true;
      }
      return false;
    });

    setCurrentSection(targetSection);
    setCurrentQuestion(targetQuestion);
    setHasInitializedPosition(true);
  }, [
    answers,
    flattenedVisibleQuestions,
    visibleQuestionIndexes,
    hasInitializedPosition,
    answersLoaded,
  ]);

  const saveSelfAnswersMutation = trpc.giftTest.saveSelfAnswers.useMutation({
    onSuccess: (data) => {
      sessionStorage.setItem("externalToken1", data.token1);
      sessionStorage.setItem("externalToken2", data.token2);

      // Limpar localStorage após finalizar
      if (testId !== null) {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${testId}_answers`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${testId}_section`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${testId}_question`);
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${testId}_globalIndex`);
      }

      toast.success("Respostas salvas com sucesso!");
      setLocation("/test/external-links");
    },
    onError: (error) => {
      toast.error("Erro ao salvar respostas: " + error.message);
    },
  });

  const handleAnswerSelect = (value: number) => {
    if (globalQuestionIndex === undefined) {
      return;
    }

    const newAnswers = [...answers];
    newAnswers[globalQuestionIndex] = value;
    setAnswers(newAnswers);

    // Salvar no banco imediatamente após cada resposta
    if (testId !== null) {
      saveProgressMutation.mutate({
        testId,
        answers: newAnswers,
      });
    }

    // Trigger animação de "drop"
    setJustSelected(true);
    setTimeout(() => setJustSelected(false), 600);

    // Iniciar transição visual
    setIsTransitioning(true);

    const hasQuestionsInSection = currentSectionQuestions.length > 0;
    const isLastQuestionInSection = hasQuestionsInSection
      ? currentQuestion >= currentSectionQuestions.length - 1
      : true;

    // Verificar se é a última pergunta (180)
    const isLastQuestion = currentSection === TOTAL_SECTIONS - 1 && isLastQuestionInSection;
    const allAnswered = flattenedVisibleQuestions.every(index => {
      const idx = flattenedVisibleQuestions.indexOf(index);
      return idx < flattenedVisibleQuestions.indexOf(globalQuestionIndex) + 1 ? newAnswers[index] !== -1 : true;
    });

    // Auto-avançar para próxima pergunta após 1500ms (1,5 segundos)
    setTimeout(() => {
      setIsTransitioning(false);
      
      // Se for a última pergunta e todas foram respondidas, mostrar modal
      if (isLastQuestion && allAnswered) {
        setShowCompletionDialog(true);
      } else if (hasQuestionsInSection && !isLastQuestionInSection) {
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
      const previousSection = currentSection - 1;
      const previousSectionQuestions = visibleQuestionIndexes[previousSection] ?? [];
      setCurrentSection(previousSection);
      setCurrentQuestion(Math.max(previousSectionQuestions.length - 1, 0));
      window.scrollTo(0, 0);
    }
  };

  const handleNext = () => {
    if (currentSectionQuestions.length === 0) {
      if (currentSection < TOTAL_SECTIONS - 1) {
        setCurrentSection(currentSection + 1);
        setCurrentQuestion(0);
        window.scrollTo(0, 0);
      }
      return;
    }

    if (currentAnswer === -1) {
      toast.error("Por favor, selecione uma resposta antes de continuar");
      return;
    }

    if (currentQuestion < currentSectionQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < TOTAL_SECTIONS - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
      window.scrollTo(0, 0);
    }
  };

  const handleFinish = () => {
    const visibleQuestionsAnswered = flattenedVisibleQuestions.every(index => answers[index] !== -1);
    if (!visibleQuestionsAnswered) {
      toast.error("Por favor, responda todas as perguntas antes de finalizar");
      return;
    }

    if (!testId) {
      toast.error("ID do teste não encontrado");
      return;
    }

    const finalAnswers = maritalStatus === "married"
      ? answers.map((value, index) => {
          if (HIDDEN_CELIBACY_SET.has(index)) {
            return value === -1 ? 0 : value;
          }
          return value;
        })
      : answers;

    saveSelfAnswersMutation.mutate({
      testId,
      answers: finalAnswers,
    });
  };

  const handleCompletionContinue = () => {
    setShowCompletionDialog(false);
    handleFinish();
  };

  const isLastSection = currentSection === TOTAL_SECTIONS - 1;
  const isLastQuestion = currentSectionQuestions.length > 0
    ? currentQuestion === currentSectionQuestions.length - 1
    : true;
  const allAnswered = flattenedVisibleQuestions.every(index => answers[index] !== -1);

  // Obter o texto da resposta selecionada
  const selectedOptionText =
    globalQuestionIndex !== undefined && currentAnswer !== -1
      ? scale.options.find(opt => opt.value === currentAnswer)?.label.toUpperCase()
      : null;

  // Loading state: aguardar inicialização completa
  if (!isInitialized || !hasInitializedPosition || testId === null || !answersLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-lg font-medium text-gray-700">Carregando teste...</p>
              <p className="text-sm text-gray-500">Preparando suas perguntas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  {totalProgress} / {totalVisibleQuestions} respondidas
                </span>
              </div>
              <Progress value={totalProgressPercentage} className="h-2" />
              <div className="text-sm text-gray-600 text-center">
                Pergunta {Math.min(currentQuestion + 1, Math.max(currentSectionQuestions.length, 1))} de {Math.max(currentSectionQuestions.length, 1)}
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
            Seu progresso é salvo automaticamente - você pode recarregar a página ou voltar depois sem perder suas respostas.
          </p>
        </div>
      </div>

      {/* Modal de conclusão */}
      <CompletionDialog
        open={showCompletionDialog}
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
