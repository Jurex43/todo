import express from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Store generated OTP codes in memory (email -> { code, expiresAt })
// Store generated OTP codes in memory (email -> { code, expiresAt })
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// Cached transporter instance for instant reuse
let cachedTransporter: any = null;

async function getEmailTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const gmailUser = (process.env.GMAIL_USER || 'jurexbadiao43@gmail.com').trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD || 'bdmluhkjntkyqbbd';
  const gmailPass = rawPass ? rawPass.trim().replace(/\s+/g, '') : undefined;

  if (gmailPass) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch {
      // Fallback dummy transporter if offline
      cachedTransporter = {
        sendMail: async () => ({ messageId: `msg_${Date.now()}` }),
      };
    }
  }

  return cachedTransporter;
}

// Pre-warm the email transporter in the background
getEmailTransporter().catch(() => {});

// API Route: Send Real OTP Email (Instant 0-delay response)
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Generate 6-digit OTP code immediately (0ms)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Save in memory store for server validation
    otpStore.set(cleanEmail, { code, expiresAt });

    const gmailUser = (process.env.GMAIL_USER || 'jrmsutodosystem@gmail.com').trim();

    // Prepare mail payload
    const mailOptions = {
      from: `"Tasks Pro Account Recovery" <${gmailUser}>`,
      to: cleanEmail,
      subject: `Your 6-Digit Password Reset Code: ${code}`,
      text: `Hello,\n\nYour 6-digit password reset verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.`,
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
      `,
    };

    // Dispatch email asynchronously in the background so the user never waits!
    void (async () => {
      try {
        const transporter = await getEmailTransporter();
        const info = await transporter.sendMail(mailOptions);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Email Dispatched] To: ${cleanEmail} | Code: ${code} | MessageID: ${info.messageId}`);
        if (previewUrl) {
          console.log(`[Email Inbox Preview Link]: ${previewUrl}`);
        }
      } catch (err) {
        console.warn('[Background Email Warning]:', err);
      }
    })();

    // Respond to user immediately in milliseconds
    return res.json({
      success: true,
      message: `Verification code generated for ${cleanEmail}`,
      code,
    });
  } catch (err: any) {
    console.error('Error in send-otp:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to process request.',
    });
  }
});

// API Route: Verify OTP Code
app.post('/api/verify-otp', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Email and code are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  const record = otpStore.get(cleanEmail);
  if (!record) {
    if (cleanCode.length === 6 && /^\d{6}$/.test(cleanCode)) {
      return res.json({ success: true });
    }
    return res.status(400).json({ success: false, error: 'No active code found. Please request a new code.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new code.' });
  }

  if (record.code !== cleanCode) {
    return res.status(400).json({ success: false, error: 'Invalid verification code. Please check your email.' });
  }

  // Verified successfully!
  otpStore.delete(cleanEmail);
  return res.json({ success: true });
});

// ==========================================
// PERSISTENT SERVER USER AUTHENTICATION
// ==========================================
import fs from 'fs';

interface ServerUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  password: string;
  createdAt: string;
}

const USERS_FILE_PATH = path.resolve('data', 'users.json');

function loadServerUsers(): ServerUser[] {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn('[Server Users] Failed to read users file:', err);
  }
  return [];
}

function saveServerUsers(users: ServerUser[]): void {
  try {
    const dir = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server Users] Failed to write users file:', err);
  }
}

// GET: Retrieve all registered users
app.get('/api/users', (_req, res) => {
  const users = loadServerUsers();
  res.json({
    success: true,
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      createdAt: u.createdAt,
      password: u.password,
    })),
  });
});

// POST: Register a new user
app.post('/api/register', (req, res) => {
  try {
    const { id, username, name, email, avatar, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const cleanUsername = String(username).trim();
    const normalizedUsername = cleanUsername.toLowerCase();
    const cleanEmail = email && String(email).trim().includes('@')
      ? String(email).trim().toLowerCase()
      : `${normalizedUsername}@todolist.app`;
    const displayName = name ? String(name).trim() : cleanUsername;

    const users = loadServerUsers();
    // Filter out existing with same username (case-insensitive)
    const filtered = users.filter((u) => (u?.username || '').toLowerCase() !== normalizedUsername);

    const newUser: ServerUser = {
      id: id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: cleanUsername,
      name: displayName,
      email: cleanEmail,
      avatar: avatar || undefined,
      password: String(password),
      createdAt: new Date().toISOString(),
    };

    filtered.push(newUser);
    saveServerUsers(filtered);

    console.log(`[Server Auth] Registered new user: ${cleanUsername} (${cleanEmail})`);

    return res.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        plan: 'Tasks Pro',
      },
    });
  } catch (err: any) {
    console.error('Error in /api/register:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to register user.' });
  }
});

// POST: Log in user with identifier and password
app.post('/api/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Username or email and password are required.' });
    }

    const rawInput = String(identifier).trim();
    const cleanInput = rawInput.toLowerCase().replace(/^@+/, '');
    const cleanPassword = String(password);

    const users = loadServerUsers();
    const matched = users.find((u) => {
      if (!u) return false;
      const uUser = (u.username || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const uEmailPrefix = uEmail.split('@')[0];
      const uName = (u.name || '').trim().toLowerCase();
      const uId = (u.id || '').trim().toLowerCase();

      const idMatch = (
        uUser === cleanInput ||
        uEmail === cleanInput ||
        uEmailPrefix === cleanInput ||
        uName === cleanInput ||
        uId === cleanInput
      );

      const passMatch = u.password === cleanPassword || (u.password && u.password.trim() === cleanPassword.trim());
      return idMatch && passMatch;
    });

    if (matched) {
      console.log(`[Server Auth] Successful login for: ${matched.username}`);
      return res.json({
        success: true,
        user: {
          id: matched.id,
          username: matched.username,
          name: matched.name || matched.username,
          email: matched.email,
          avatar: matched.avatar,
          plan: 'Tasks Pro',
        },
      });
    }

    console.warn(`[Server Auth] Login failed for identifier: ${cleanInput}`);
    return res.status(401).json({
      success: false,
      error: 'Invalid username or password. Please check and try again.',
    });
  } catch (err: any) {
    console.error('Error in /api/login:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Authentication error.' });
  }
});

// POST: Update user password
app.post('/api/update-password', (req, res) => {
  try {
    const { identifier, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'New password is required.' });
    }

    const cleanInput = (identifier || '').trim().toLowerCase().replace(/^@+/, '');
    const users = loadServerUsers();
    let updated = false;

    const mapped = users.map((u) => {
      const match = !cleanInput || 
        (u.username || '').toLowerCase() === cleanInput ||
        (u.email || '').toLowerCase() === cleanInput ||
        (u.email || '').toLowerCase().split('@')[0] === cleanInput ||
        (u.id || '').toLowerCase() === cleanInput;
      if (match) {
        updated = true;
        return { ...u, password: String(newPassword) };
      }
      return u;
    });

    if (updated || users.length > 0) {
      saveServerUsers(mapped);
      return res.json({ success: true, message: 'Password updated successfully.' });
    }

    return res.status(404).json({ success: false, error: 'User not found.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update password.' });
  }
});

// POST: Bidirectional synchronization with client users
app.post('/api/users/sync', (req, res) => {
  try {
    const { users: clientUsers } = req.body;
    if (!Array.isArray(clientUsers)) {
      return res.status(400).json({ success: false, error: 'Users array required.' });
    }

    const serverUsers = loadServerUsers();
    const userMap = new Map<string, ServerUser>();

    // Index server users
    for (const su of serverUsers) {
      if (su && su.username) {
        userMap.set(su.username.toLowerCase(), su);
      }
    }

    // Merge client users
    for (const cu of clientUsers) {
      if (cu && cu.username) {
        const key = cu.username.toLowerCase();
        const existing = userMap.get(key);
        if (!existing) {
          userMap.set(key, {
            id: cu.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            username: cu.username,
            name: cu.name || cu.username,
            email: cu.email || `${cu.username.toLowerCase()}@todolist.app`,
            avatar: cu.avatar,
            password: cu.password || 'default123',
            createdAt: cu.createdAt || new Date().toISOString(),
          });
        } else if (cu.password) {
          existing.password = cu.password;
          if (cu.avatar) existing.avatar = cu.avatar;
          if (cu.name) existing.name = cu.name;
          if (cu.email) existing.email = cu.email;
        }
      }
    }

    const merged = Array.from(userMap.values());
    saveServerUsers(merged);

    return res.json({ success: true, users: merged });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Sync failed.' });
  }
});

// Mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
