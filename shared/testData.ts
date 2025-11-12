import gifts from "./gifts.json";
import selfQuestions from "./self_assessment_questions.json";
import externalQuestions from "./external_assessment_questions.json";

export const GIFTS = gifts;
export const SELF_ASSESSMENT_QUESTIONS = selfQuestions;
export const EXTERNAL_ASSESSMENT_QUESTIONS = externalQuestions;

// Escalas de classificação para cada seção
export const SECTION_SCALES = [
  {
    // Seção 1
    options: [
      { value: 4, label: "Muitíssimo" },
      { value: 3, label: "Muito" },
      { value: 2, label: "Eventualmente" },
      { value: 1, label: "Raramente" },
      { value: 0, label: "De forma nenhuma" },
    ],
    prefix: "Sinto-me",
    suffix: "realizado(a) ao",
  },
  {
    // Seção 2
    options: [
      { value: 4, label: "Enorme vontade" },
      { value: 3, label: "Grande vontade" },
      { value: 2, label: "Apenas vontade" },
      { value: 1, label: "Pouca vontade" },
      { value: 0, label: "Nenhuma vontade" },
    ],
    prefix: "Tenho",
    suffix: "de me envolver, mais do que fiz até agora, em",
  },
  {
    // Seção 3
    options: [
      { value: 4, label: "Muitas vezes" },
      { value: 3, label: "Frequentemente" },
      { value: 2, label: "De vez em quando" },
      { value: 1, label: "Raramente" },
      { value: 0, label: "Nunca" },
    ],
    prefix: "",
    suffix: "tive a experiência de",
  },
  {
    // Seção 4
    options: [
      { value: 4, label: "Muito fortemente" },
      { value: 3, label: "Fortemente" },
      { value: 2, label: "Mais ou menos" },
      { value: 1, label: "Muito pouco" },
      { value: 0, label: "Não correspondem" },
    ],
    prefix: "As afirmações a seguir",
    suffix: "correspondem:",
  },
  {
    // Seção 5
    options: [
      { value: 4, label: "É muito fácil" },
      { value: 3, label: "É fácil" },
      { value: 2, label: "Não é nem fácil nem difícil" },
      { value: 1, label: "É relativamente difícil" },
      { value: 0, label: "É bem difícil" },
    ],
    prefix: "Para mim",
    suffix: "",
  },
  {
    // Seção 6
    options: [
      { value: 4, label: "Muitíssimo" },
      { value: 3, label: "Muito" },
      { value: 2, label: "Eventualmente" },
      { value: 1, label: "Raramente" },
      { value: 0, label: "De forma nenhuma" },
    ],
    prefix: "Eu estaria",
    suffix: "disposto a",
  },
];

export const EXTERNAL_SCALE = {
  options: [
    { value: 4, label: "Muito bem que" },
    { value: 3, label: "Que" },
    { value: 2, label: "Que em alguma situações" },
    { value: 1, label: "Que raramente" },
    { value: 0, label: "Que de forma nenhuma" },
  ],
  prefix: "Em relação a",
  suffix: "posso imaginar",
};
