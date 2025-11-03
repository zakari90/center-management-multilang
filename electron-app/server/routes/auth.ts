import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../../lib/db';
import { encrypt, setSession, clearSession, getSession } from '../../lib/authentication';

export const authRoutes = Router();

// Login
authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const session = await encrypt({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    setSession(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error: any) {
    console.error('[LOGIN_ERROR]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register
authRoutes.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });

    setSession(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error: any) {
    console.error('[REGISTER_ERROR]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
authRoutes.get('/me', async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ user: session.user });
  } catch (error: any) {
    console.error('[GET_ME_ERROR]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
authRoutes.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ message: 'Logged out successfully' });
});

