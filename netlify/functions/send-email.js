// ARQUIVO DO SEU RELAY NA NETLIFY (.js)

// --- ALTERAÇÃO 1: Importar o módulo 'dns' ---
const dns = require('dns'); 
const nodemailer = require('nodemailer');

// --- ALTERAÇÃO 2: Forçar a resolução de DNS para IPv4 ---
// Esta é a correção principal para o erro 'EBADNAME' na Netlify.
dns.setDefaultResultOrder('ipv4first');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST' ) {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Método não permitido.' })
    };
  }

  const providedToken = event.headers['x-relay-secret'];
  const authToken = process.env.RELAY_TOKEN;

  if (!providedToken || providedToken !== authToken) {
    console.warn("🚫 Tentativa de acesso com token inválido ou ausente.");
    return {
      statusCode: 403,
      body: JSON.stringify({ success: false, message: "Acesso negado." })
    };
  }

  try {
    const { to, cc, subject, html } = JSON.parse(event.body);

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Campos obrigatórios ausentes: to, subject e html." })
      };
    }
    
    // --- ALTERAÇÃO 3 (Recomendado): Simplificar a configuração do Nodemailer ---
    // Em vez de usar host/port, o 'service: "gmail"' é mais confiável,
    // pois lida com as configurações do Gmail automaticamente.
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Mais robusto que configurar host/port manualmente
      auth: {
        user: process.env.SMTP_USER, // Deve ser seu e-mail do Gmail
        pass: process.env.SMTP_PASS, // Deve ser sua SENHA DE APP do Google
      },
    });

    await transporter.sendMail({
      from: `"Sistema de Indicações ADIM" <${process.env.SMTP_USER}>`,
      to,
      cc,
      subject,
      html,
    });

    console.log(`📧 E-mail enviado com sucesso para ${to}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "E-mail enviado com sucesso!" })
    };

  } catch (error) {
    // Adicionado um log mais detalhado do erro para facilitar a depuração futura
    console.error("❌ Erro detalhado ao enviar e-mail:", error); 
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        message: "Falha no envio do e-mail.",
        // Enviar a mensagem de erro no corpo da resposta pode ajudar a depurar
        error: error.message 
      })
    };
  }
};