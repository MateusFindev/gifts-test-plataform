import { logger } from "./_core/logger";
import nodemailer from "nodemailer";

interface EmailResult {
  manifestGifts: string[];
  latentGifts: string[];
  name: string;
  organization?: string;
}

export async function sendResultEmail(
  recipientEmail: string,
  result: EmailResult
): Promise<boolean> {
  logger.info("Email: iniciando envio", { recipientEmail });
  
  try {
    // Verificar se as credenciais do Gmail estão configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      logger.warn("Credenciais do Gmail não configuradas. Email não será enviado.");
      logger.warn("Configure GMAIL_USER e GMAIL_APP_PASSWORD no painel de Secrets.");
      return false;
    }
    
    logger.debug("Email: credenciais encontradas, configurando transporter");

    // Configurar transporter do Nodemailer com Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    
    logger.debug("Email: transporter configurado, preparando conteúdo");

    // Formatar lista de dons
    const formatGiftList = (gifts: string[]) => {
      if (gifts.length === 0) return "Nenhum dom identificado nesta categoria.";
      return gifts.map((gift, index) => `${index + 1}. ${gift}`).join("\n");
    };

    // Construir corpo do email
    const emailBody = `
Olá ${result.name},

Seu teste de dons espirituais foi concluído com sucesso!
${result.organization ? `Organização: ${result.organization}\n` : ""}

=== DONS MANIFESTOS ===
${formatGiftList(result.manifestGifts)}

=== DONS LATENTES ===
${formatGiftList(result.latentGifts)}

---

Os Dons Manifestos são aqueles que você já demonstra com maior intensidade em sua vida e ministério.

Os Dons Latentes são aqueles que possuem potencial para serem desenvolvidos e aprimorados.

Que Deus continue abençoando sua jornada!

---
Plataforma de Testes de Dons
    `.trim();

    // Enviar email
    console.log("[Email] Enviando email...");
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: recipientEmail,
      subject: "Resultado do Teste de Dons Espirituais",
      text: emailBody,
    });

    logger.info("Email enviado com sucesso", { messageId: info.messageId, recipientEmail });
    return true;
  } catch (error: any) {
    logger.error("Erro ao enviar email", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: (error as any)?.code,
      response: (error as any)?.response,
    });
    return false;
  }
}
