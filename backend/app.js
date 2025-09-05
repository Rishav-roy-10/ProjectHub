import express from 'express';
import morgan from 'morgan';
import connectDB from './db/db.js';
import userRoutes from './routes/user.route.js';
import projectRoutes from './routes/project.route.js';
import chatRoutes from './routes/chat.route.js';
import fileRoutes from './routes/file.route.js';
import codeExecutionRoutes from './routes/code-execution.route.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import aiRoutes from './routes/ai.route.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

connectDB();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/project', projectRoutes);
app.use('/chat', chatRoutes);
app.use('/ai', aiRoutes);
app.use('/file', fileRoutes);
app.use('/code', codeExecutionRoutes);
app.use('/user', userRoutes);


app.get('/', (req, res) => {
  res.send('API is running');
});

export default app;


