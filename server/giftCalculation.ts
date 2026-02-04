import gifts from "../shared/gifts.json";

/**
 * Calcula os dons manifestos e latentes com base nas respostas
 * 
 * Dons Manifestos: perguntas 1-30, 61-90, 121-150 + avaliações externas (A1-A30, a1-a30)
 * Dons Latentes: perguntas 31-60, 91-120, 151-180
 */

interface GiftScore {
  gift: string;
  score: number;
}

export function calculateGifts(
  selfAnswers: number[],      // 180 respostas de autoavaliação
  externalAnswers1?: number[], // 30 respostas da primeira pessoa
  externalAnswers2?: number[], // 30 respostas da segunda pessoa
): {
  manifestGifts: string[];
  latentGifts: string[];
  manifestGiftScores: GiftScore[];
  latentGiftScores: GiftScore[];
} {
  // 1) Inicializar pontuações para cada dom (30 dons)
  const manifestScores: number[] = new Array(30).fill(0);
  const latentScores: number[] = new Array(30).fill(0);

  // 2) Dons manifestos - autoavaliação
  // Perguntas 1-30 (índices 0-29)
  for (let i = 0; i < 30; i++) {
    const giftIndex = i % 30;
    manifestScores[giftIndex] += selfAnswers[i] ?? 0;
  }

  // Perguntas 61-90 (índices 60-89)
  for (let i = 60; i < 90; i++) {
    const giftIndex = i % 30;
    manifestScores[giftIndex] += selfAnswers[i] ?? 0;
  }

  // Perguntas 121-150 (índices 120-149)
  for (let i = 120; i < 150; i++) {
    const giftIndex = i % 30;
    manifestScores[giftIndex] += selfAnswers[i] ?? 0;
  }

  // 3) Somar avaliações externas (se existirem)
  if (externalAnswers1) {
    for (let i = 0; i < 30; i++) {
      manifestScores[i] += externalAnswers1[i] ?? 0;
    }
  }

  if (externalAnswers2) {
    for (let i = 0; i < 30; i++) {
      manifestScores[i] += externalAnswers2[i] ?? 0;
    }
  }

  // 4) Dons latentes - autoavaliação
  // Perguntas 31-60 (índices 30-59)
  for (let i = 30; i < 60; i++) {
    const giftIndex = i % 30;
    latentScores[giftIndex] += selfAnswers[i] ?? 0;
  }

  // Perguntas 91-120 (índices 90-119)
  for (let i = 90; i < 120; i++) {
    const giftIndex = i % 30;
    latentScores[giftIndex] += selfAnswers[i] ?? 0;
  }

  // Perguntas 151-180 (índices 150-179)
  for (let i = 150; i < 180; i++) {
    const giftIndex = i % 30;
    latentScores[giftIndex] += selfAnswers[i] ?? 0;
  }

  // 5) Montar lista completa de scores (todos os dons)
  const allManifestGiftScores: GiftScore[] = gifts.map((gift, index) => ({
    gift,
    score: manifestScores[index] ?? 0,
  }));

  const allLatentGiftScores: GiftScore[] = gifts.map((gift, index) => ({
    gift,
    score: latentScores[index] ?? 0,
  }));

  // 6) Selecionar Dons Manifestos: top 5 por score (com filtro >= 15)
  // se quiser SEM limiar, é só remover o filter.
  const manifestTop = allManifestGiftScores
    .filter(item => item.score >= 15)
    .sort((a, b) => b.score - a.score || a.gift.localeCompare(b.gift))
    .slice(0, 5);

  const manifestGiftsList = manifestTop.map(item => item.gift);

  // 7) Selecionar Dons Latentes: top 5 entre os que não são manifestos
  const latentTop = allLatentGiftScores
    .filter(item => !manifestGiftsList.includes(item.gift))
    .sort((a, b) => b.score - a.score || a.gift.localeCompare(b.gift))
    .slice(0, 5);

  const latentGiftsList = latentTop.map(item => item.gift);

  return {
    manifestGifts: manifestGiftsList,
    latentGifts: latentGiftsList,
    manifestGiftScores: manifestTop,
    latentGiftScores: latentTop,
  };
}

/**
 * Calcula o ranking completo de todos os 30 dons (sem filtros)
 * Usado para exibir a pontuação completa no painel administrativo
 */
export function calculateFullGiftRanking(
  selfAnswers: number[],
  externalAnswers1?: number[],
  externalAnswers2?: number[],
): {
  allManifestScores: GiftScore[];
  allLatentScores: GiftScore[];
} {
  // 1) Inicializar pontuações para cada dom (30 dons)
  const manifestScores: number[] = new Array(30).fill(0);
  const latentScores: number[] = new Array(30).fill(0);

  // 2) Dons manifestos - autoavaliação
  for (let i = 0; i < 30; i++) {
    manifestScores[i % 30] += selfAnswers[i] ?? 0;
  }
  for (let i = 60; i < 90; i++) {
    manifestScores[i % 30] += selfAnswers[i] ?? 0;
  }
  for (let i = 120; i < 150; i++) {
    manifestScores[i % 30] += selfAnswers[i] ?? 0;
  }

  // 3) Somar avaliações externas
  if (externalAnswers1) {
    for (let i = 0; i < 30; i++) {
      manifestScores[i] += externalAnswers1[i] ?? 0;
    }
  }
  if (externalAnswers2) {
    for (let i = 0; i < 30; i++) {
      manifestScores[i] += externalAnswers2[i] ?? 0;
    }
  }

  // 4) Dons latentes - autoavaliação
  for (let i = 30; i < 60; i++) {
    latentScores[i % 30] += selfAnswers[i] ?? 0;
  }
  for (let i = 90; i < 120; i++) {
    latentScores[i % 30] += selfAnswers[i] ?? 0;
  }
  for (let i = 150; i < 180; i++) {
    latentScores[i % 30] += selfAnswers[i] ?? 0;
  }

  // 5) Montar lista completa de scores (todos os 30 dons)
  const allManifestScores: GiftScore[] = gifts
    .map((gift, index) => ({
      gift,
      score: manifestScores[index] ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.gift.localeCompare(b.gift));

  const allLatentScores: GiftScore[] = gifts
    .map((gift, index) => ({
      gift,
      score: latentScores[index] ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.gift.localeCompare(b.gift));

  return {
    allManifestScores,
    allLatentScores,
  };
}
