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
  selfAnswers: number[], // 180 respostas de autoavaliação
  externalAnswers1?: number[], // 30 respostas da primeira pessoa
  externalAnswers2?: number[] // 30 respostas da segunda pessoa
): {
  manifestGifts: string[];
  latentGifts: string[];
} {
  // Inicializar pontuações para cada dom
  const manifestScores: number[] = new Array(30).fill(0);
  const latentScores: number[] = new Array(30).fill(0);

  // Calcular pontuações dos Dons Manifestos
  // Perguntas 1-30 (índices 0-29)
  for (let i = 0; i < 30; i++) {
    const giftIndex = i % 30;
    manifestScores[giftIndex] += selfAnswers[i] || 0;
  }

  // Perguntas 61-90 (índices 60-89)
  for (let i = 60; i < 90; i++) {
    const giftIndex = i % 30;
    manifestScores[giftIndex] += selfAnswers[i] || 0;
  }

  // Perguntas 121-150 (índices 120-149)
  for (let i = 120; i < 150; i++) {
    const giftIndex = i % 30;
    manifestScores[giftIndex] += selfAnswers[i] || 0;
  }

  // Adicionar avaliações externas aos Dons Manifestos
  if (externalAnswers1) {
    for (let i = 0; i < 30; i++) {
      manifestScores[i] += externalAnswers1[i] || 0;
    }
  }

  if (externalAnswers2) {
    for (let i = 0; i < 30; i++) {
      manifestScores[i] += externalAnswers2[i] || 0;
    }
  }

  // Calcular pontuações dos Dons Latentes
  // Perguntas 31-60 (índices 30-59)
  for (let i = 30; i < 60; i++) {
    const giftIndex = i % 30;
    latentScores[giftIndex] += selfAnswers[i] || 0;
  }

  // Perguntas 91-120 (índices 90-119)
  for (let i = 90; i < 120; i++) {
    const giftIndex = i % 30;
    latentScores[giftIndex] += selfAnswers[i] || 0;
  }

  // Perguntas 151-180 (índices 150-179)
  for (let i = 150; i < 180; i++) {
    const giftIndex = i % 30;
    latentScores[giftIndex] += selfAnswers[i] || 0;
  }

  // Selecionar Dons Manifestos (pontuação >= 15)
  const manifestGiftsList: string[] = [];
  let x = 0;
  for (let i = 0; i < 30; i++) {
    if (manifestScores[i] >= 15) {
      x++;
      if (x <= 5) {
        manifestGiftsList.push(gifts[i]);
      }
    }
  }

  // Selecionar Dons Latentes (5 maiores que não estão nos manifestos)
  const latentGiftScores: GiftScore[] = gifts.map((gift, index) => ({
    gift,
    score: latentScores[index],
  }));

  // Filtrar dons que não estão nos manifestos
  const availableLatentGifts = latentGiftScores.filter(
    (item) => !manifestGiftsList.includes(item.gift)
  );

  // Ordenar por pontuação decrescente e pegar os 5 primeiros
  availableLatentGifts.sort((a, b) => b.score - a.score);
  const latentGiftsList = availableLatentGifts.slice(0, 5).map((item) => item.gift);

  return {
    manifestGifts: manifestGiftsList,
    latentGifts: latentGiftsList,
  };
}
