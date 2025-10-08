const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // A Netlify só permite o método que corresponde ao nome da função,
  // mas esta verificação é uma boa prática.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Método não permitido.' })
    };
  }

  // --- Validação do token de segurança ---
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
    // --- Leitura e validação dos dados do e-mail ---
    const { to, cc, subject, html } = JSON.parse(event.body);

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Campos obrigatórios ausentes: to, subject e html." })
      };
    }
    
    // --- Configuração do transporte SMTP ---
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_PORT == 465, // true para 465, false para 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // --- Envio do E-mail ---
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
    console.error("❌ Erro ao enviar e-mail:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Falha no envio do e-mail." })
    };
  }
};
