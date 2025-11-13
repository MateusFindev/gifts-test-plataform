import { addDays, subDays } from "date-fns";

type AdminResultStatus = "draft" | "in_progress" | "awaiting_external" | "completed";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "scale";
  respondentCount: number;
  completionRate: number;
  activeLinks: number;
  createdAt: string;
  contactName: string;
  contactEmail: string;
};

export type GiftScore = {
  name: string;
  description: string;
  value: number;
};

export type ExternalAssessmentInfo = {
  name: string;
  relation: string;
  status: "pending" | "completed";
  completedAt?: string;
};

export type AdminResultRecord = {
  id: string;
  personName: string;
  email: string;
  organizationId: string;
  organizationName: string;
  status: AdminResultStatus;
  score: number;
  createdAt: string;
  completedAt?: string;
  manifestGifts: GiftScore[];
  latentGifts: GiftScore[];
  tags: string[];
  externalAssessments: ExternalAssessmentInfo[];
};

const today = new Date();

export const mockOrganizations: OrganizationSummary[] = [
  {
    id: "all",
    name: "Todas as organizações",
    slug: "all",
    plan: "scale",
    respondentCount: 1280,
    completionRate: 0.91,
    activeLinks: 78,
    createdAt: subDays(today, 120).toISOString(),
    contactName: "Time Central",
    contactEmail: "contato@dons.app",
  },
  {
    id: "grace-church",
    name: "Comunidade Graça Viva",
    slug: "grace-church",
    plan: "scale",
    respondentCount: 420,
    completionRate: 0.94,
    activeLinks: 24,
    createdAt: subDays(today, 210).toISOString(),
    contactName: "Pr. Marcos Souza",
    contactEmail: "marcos@gc.org",
  },
  {
    id: "hope-church",
    name: "Igreja Esperança",
    slug: "hope-church",
    plan: "growth",
    respondentCount: 310,
    completionRate: 0.88,
    activeLinks: 18,
    createdAt: subDays(today, 160).toISOString(),
    contactName: "Pr. Ana Lira",
    contactEmail: "ana@esperanca.org",
  },
  {
    id: "youth-move",
    name: "Ministério Jovem Movimento",
    slug: "youth-move",
    plan: "starter",
    respondentCount: 165,
    completionRate: 0.83,
    activeLinks: 9,
    createdAt: subDays(today, 92).toISOString(),
    contactName: "Lucas Andrade",
    contactEmail: "lucas@movimento.org",
  },
];

export const mockGiftDistribution = [
  { gift: "Ensino", manifest: 42, latent: 19 },
  { gift: "Profecia", manifest: 37, latent: 14 },
  { gift: "Serviço", manifest: 33, latent: 21 },
  { gift: "Contribuição", manifest: 28, latent: 17 },
  { gift: "Apóstolo", manifest: 18, latent: 23 },
  { gift: "Liderança", manifest: 45, latent: 12 },
];

export const mockEngagementTrend = [
  { month: "Jan", completed: 120, started: 180 },
  { month: "Fev", completed: 150, started: 210 },
  { month: "Mar", completed: 190, started: 240 },
  { month: "Abr", completed: 220, started: 260 },
  { month: "Mai", completed: 250, started: 310 },
  { month: "Jun", completed: 270, started: 320 },
];

export const mockHighlights = [
  {
    id: "grace-church",
    name: "Comunidade Graça Viva",
    topGift: "Liderança",
    respondents: 420,
    growth: 0.21,
  },
  {
    id: "hope-church",
    name: "Igreja Esperança",
    topGift: "Serviço",
    respondents: 310,
    growth: 0.18,
  },
  {
    id: "youth-move",
    name: "Ministério Jovem Movimento",
    topGift: "Evangelismo",
    respondents: 165,
    growth: 0.27,
  },
];

export const mockResults: AdminResultRecord[] = [
  {
    id: "RST-9214",
    personName: "Bianca Ribeiro",
    email: "bianca@exemplo.com",
    organizationId: "grace-church",
    organizationName: "Comunidade Graça Viva",
    status: "completed",
    score: 94,
    createdAt: subDays(today, 8).toISOString(),
    completedAt: subDays(today, 1).toISOString(),
    tags: ["manifesto"],
    manifestGifts: [
      { name: "Liderança", description: "Influência natural sobre equipes", value: 92 },
      { name: "Ensino", description: "Explica verdades bíblicas com clareza", value: 89 },
      { name: "Profecia", description: "Percepção espiritual aguçada", value: 81 },
    ],
    latentGifts: [
      { name: "Misericórdia", description: "Sensibilidade aos que sofrem", value: 74 },
      { name: "Serviço", description: "Executa tarefas com excelência", value: 68 },
      { name: "Contribuição", description: "Generosidade e boa administração", value: 63 },
    ],
    externalAssessments: [
      {
        name: "Maria Fernandes",
        relation: "Líder de célula",
        status: "completed",
        completedAt: subDays(today, 2).toISOString(),
      },
      {
        name: "João Silva",
        relation: "Mentor",
        status: "completed",
        completedAt: subDays(today, 1).toISOString(),
      },
    ],
  },
  {
    id: "RST-8821",
    personName: "Eduardo Lima",
    email: "eduardo@exemplo.com",
    organizationId: "hope-church",
    organizationName: "Igreja Esperança",
    status: "awaiting_external",
    score: 72,
    createdAt: subDays(today, 4).toISOString(),
    tags: ["externo"],
    manifestGifts: [
      { name: "Evangelismo", description: "Fácil comunicação com novos membros", value: 77 },
      { name: "Apóstolo", description: "Visão para novos projetos", value: 71 },
    ],
    latentGifts: [
      { name: "Serviço", description: "Ajuda prática constante", value: 64 },
      { name: "Profecia", description: "Discernimento espiritual", value: 58 },
    ],
    externalAssessments: [
      {
        name: "Fernanda Costa",
        relation: "Amigo próximo",
        status: "pending",
      },
      {
        name: "Lucas Mendes",
        relation: "Pastor de jovens",
        status: "completed",
        completedAt: subDays(today, 1).toISOString(),
      },
    ],
  },
  {
    id: "RST-8719",
    personName: "Larissa Prado",
    email: "larissa@exemplo.com",
    organizationId: "youth-move",
    organizationName: "Ministério Jovem Movimento",
    status: "in_progress",
    score: 58,
    createdAt: subDays(today, 2).toISOString(),
    tags: ["autoavaliacao"],
    manifestGifts: [
      { name: "Serviço", description: "Extremamente disponível para apoiar", value: 61 },
    ],
    latentGifts: [
      { name: "Hospitalidade", description: "Cria ambientes acolhedores", value: 55 },
      { name: "Misericórdia", description: "Empatia acima da média", value: 52 },
    ],
    externalAssessments: [
      {
        name: "Carol Santos",
        relation: "Discipuladora",
        status: "pending",
      },
      {
        name: "Pedro Reis",
        relation: "Amigo de ministério",
        status: "pending",
      },
    ],
  },
  {
    id: "RST-8411",
    personName: "Gabriel Nascimento",
    email: "gabriel@exemplo.com",
    organizationId: "grace-church",
    organizationName: "Comunidade Graça Viva",
    status: "completed",
    score: 89,
    createdAt: subDays(today, 14).toISOString(),
    completedAt: subDays(today, 5).toISOString(),
    tags: ["manifesto"],
    manifestGifts: [
      { name: "Pastor", description: "Cuida bem de grupos pequenos", value: 86 },
      { name: "Misericórdia", description: "Escuta ativa e aconselhamento", value: 82 },
    ],
    latentGifts: [
      { name: "Ensino", description: "Pode desenvolver estudo bíblico", value: 71 },
      { name: "Liderança", description: "Capacidade de conduzir equipes", value: 69 },
    ],
    externalAssessments: [
      {
        name: "Juliana Braga",
        relation: "Coordenadora",
        status: "completed",
        completedAt: subDays(today, 5).toISOString(),
      },
      {
        name: "Renato Brito",
        relation: "Supervisor",
        status: "completed",
        completedAt: subDays(today, 4).toISOString(),
      },
    ],
  },
];

export const mockActivityFeed = [
  {
    id: 1,
    message: "Bianca Ribeiro concluiu o teste",
    organizationId: "grace-church",
    timestamp: subDays(today, 1).toISOString(),
  },
  {
    id: 2,
    message: "Novo link externo criado para Igreja Esperança",
    organizationId: "hope-church",
    timestamp: subDays(today, 2).toISOString(),
  },
  {
    id: 3,
    message: "Larissa Prado completou 60% do teste",
    organizationId: "youth-move",
    timestamp: subDays(today, 2).toISOString(),
  },
];

export const mockRespondentGrowth = [
  { label: "Hoje", value: 26 },
  { label: "7 dias", value: 142 },
  { label: "30 dias", value: 612 },
];

export const mockNextSteps = [
  {
    id: "setup-1",
    title: "Conectar novos administradores",
    description: "Convide líderes de ministério e configure as permissões.",
    linkLabel: "Gerenciar membros",
  },
  {
    id: "setup-2",
    title: "Criar link público",
    description: "Compartilhe um link para que os membros respondam rapidamente.",
    linkLabel: "Criar link",
  },
];

export const mockPlanLimits = {
  totalRespondents: 1280,
  planLimit: 2500,
  organizations: 12,
  maxOrganizations: 25,
};

export const mockOrganizationNotes = [
  {
    id: "note-1",
    organizationId: "grace-church",
    author: "Pr. Marcos",
    message: "Equipe pastoral pretende treinar os líderes de célula com base nos resultados deste mês.",
    createdAt: subDays(today, 3).toISOString(),
  },
  {
    id: "note-2",
    organizationId: "hope-church",
    author: "Ana Lira",
    message: "Trabalho com casais terá foco nos dons de misericórdia e aconselhamento.",
    createdAt: subDays(today, 5).toISOString(),
  },
];

export const mockUpcomingEvents = [
  {
    id: "event-1",
    title: "Treinamento de novos líderes",
    organizationId: "grace-church",
    startAt: addDays(today, 4).toISOString(),
  },
  {
    id: "event-2",
    title: "Semana de dons - Ministério Jovem",
    organizationId: "youth-move",
    startAt: addDays(today, 11).toISOString(),
  },
];
