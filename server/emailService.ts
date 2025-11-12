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
  console.log("[Email] Iniciando envio de email para:", recipientEmail);
  
  try {
    // Verificar se as credenciais do Gmail estão configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn("[Email] Credenciais do Gmail não configuradas. Email não será enviado.");
      console.warn("[Email] Configure GMAIL_USER e GMAIL_APP_PASSWORD no painel de Secrets.");
      return false;
    }
    
    console.log("[Email] Credenciais encontradas. Configurando transporter...");

    // Configurar transporter do Nodemailer com Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    
    console.log("[Email] Transporter configurado. Preparando conteúdo...");

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

    console.log(`[Email] Email enviado com sucesso! MessageId: ${info.messageId}`);
    console.log(`[Email] Destinatário: ${recipientEmail}`);
    return true;
  } catch (error: any) {
    console.error("[Email] ERRO ao enviar email:");
    console.error("[Email] Tipo de erro:", error.name);
    console.error("[Email] Mensagem:", error.message);
    console.error("[Email] Stack:", error.stack);
    if (error.code) {
      console.error("[Email] Código de erro:", error.code);
    }
    if (error.response) {
      console.error("[Email] Resposta do servidor:", error.response);
    }
    return false;
  }
}
