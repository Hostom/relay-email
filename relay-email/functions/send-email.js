import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function handler(event) {
  try {
    const { to, subject, message } = JSON.parse(event.body);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Relay de E-mails" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `<div style="font-family: Arial, sans-serif; color: #333;">
               <h2>${subject}</h2>
               <p>${message}</p>
             </div>`,
    });

    console.log("📧 E-mail enviado com sucesso:", info.messageId);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: info.messageId }),
    };
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
}
