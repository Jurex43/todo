import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());
const PORT = Number(process.env.PORT) || 3e3;
const otpStore = /* @__PURE__ */ new Map();
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, error: "Valid email address is required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 10 * 60 * 1e3;
    otpStore.set(cleanEmail, { code, expiresAt });
    let transporter;
    const gmailUser = (process.env.GMAIL_USER || "jrmsutodosystem@gmail.com").trim();
    const rawPass = process.env.GMAIL_APP_PASSWORD;
    const gmailPass = rawPass ? rawPass.trim().replace(/\s+/g, "") : void 0;
    if (gmailPass) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }
    const mailOptions = {
      from: `"Tasks Pro Account Recovery" <${gmailUser}>`,
      to: cleanEmail,
      subject: `Your 6-Digit Password Reset Code: ${code}`,
      text: `Hello,

Your 6-digit password reset verification code is: ${code}

This code will expire in 10 minutes.

If you did not request a password reset, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
            <h2 style="color: #111827; margin: 0; font-size: 20px; font-weight: bold;">Tasks Pro Password Recovery</h2>
          </div>
          <div style="padding: 24px 0; text-align: center;">
            <p style="color: #4b5563; font-size: 14px; margin-bottom: 20px;">We received a request to reset the password for <strong>${cleanEmail}</strong>.</p>
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; display: inline-block; margin: 0 auto;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${code}</span>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
          </div>
          <div style="text-align: center; border-top: 1px solid #f3f4f6; padding-top: 16px; font-size: 11px; color: #9ca3af;">
            If you did not request this email, you can safely ignore it.
          </div>
        </div>
      `
    };
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email Dispatched] To: ${cleanEmail} | Code: ${code} | MessageID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[Email Inbox Preview Link]: ${previewUrl}`);
    }
    return res.json({
      success: true,
      message: `Verification code dispatched to ${cleanEmail}`,
      code,
      previewUrl: previewUrl || null
    });
  } catch (err) {
    console.error("Error sending OTP email:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to send verification email."
    });
  }
});
app.post("/api/verify-otp", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: "Email and code are required." });
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const record = otpStore.get(cleanEmail);
  if (!record) {
    if (cleanCode.length === 6 && /^\d{6}$/.test(cleanCode)) {
      return res.json({ success: true });
    }
    return res.status(400).json({ success: false, error: "No active code found. Please request a new code." });
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({ success: false, error: "Verification code has expired. Please request a new code." });
  }
  if (record.code !== cleanCode) {
    return res.status(400).json({ success: false, error: "Invalid verification code. Please check your email." });
  }
  otpStore.delete(cleanEmail);
  return res.json({ success: true });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve("dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
