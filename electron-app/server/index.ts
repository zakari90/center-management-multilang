import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRoutes } from './routes/auth';
import { managerRoutes } from './routes/manager';
import { centerRoutes } from './routes/center';
import { studentRoutes } from './routes/students';
import { teacherRoutes } from './routes/teachers';
import { subjectRoutes } from './routes/subjects';
import { receiptRoutes } from './routes/receipts';
import { dashboardRoutes } from './routes/dashboard';
import { adminRoutes } from './routes/admin';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { default: db } = await import('../lib/db');
    await db.user.findMany();
    res.json({
      success: true,
      message: '✓ Connected to MongoDB successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/center', centerRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

export async function startServer(port: number = 3001): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      resolve(port);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        startServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

