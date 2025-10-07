import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// --- Segurança: token de autenticação ---
const AUTH_TOKEN = process.env.RELAY_TOKEN;

// --- Configuração do transporte SMTP ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_PORT == 465, // Lógica corrigida para ser flexível
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- Teste inicial da conexão SMTP ---
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erro ao conectar no servidor SMTP:", error.message);
  } else {
    console.log("✅ Conectado ao servidor SMTP com sucesso!");
  }
});

// --- Endpoint principal para envio de e-mails ---
app.post("/send", async (req, res) => {
  // --- Validação do token (agora lendo do cabeçalho) ---
  const providedToken = req.headers['x-relay-secret'];

  if (!providedToken || providedToken !== AUTH_TOKEN) {
    console.warn("🚫 Tentativa de acesso com token inválido ou ausente.");
    return res.status(403).json({ success: false, message: "Acesso negado." });
  }

  // --- Leitura dos dados do e-mail (incluindo o 'cc') ---
  const { to, cc, subject, html } = req.body;

  // --- Validação dos campos obrigatórios ---
  if (!to || !subject || !html) {
    return res.status(400).json({
      success: false,
      message: "Campos obrigatórios ausentes: to, subject e html.",
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"Sistema de Indicações ADIM" <${process.env.SMTP_USER}>`,
      to,
      cc, // Campo 'cc' adicionado
      subject,
      html,
    });

    console.log(`📧 E-mail enviado para ${to} | ID: ${info.messageId}`);
    res.status(200).json({ success: true, message: "E-mail enviado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error.message);
    res.status(500).json({ success: false, message: "Falha no envio do e-mail." });
  }
});

// --- Rota de verificação (debug) ---
app.get("/", (req, res) => {
  res.send("🚀 Relay de E-mails ativo e operacional!");
});

// --- Inicialização do servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Servidor relay rodando na porta ${PORT}`));

