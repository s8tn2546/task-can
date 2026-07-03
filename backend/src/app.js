require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth.middleware');
const errorMiddleware = require('./middleware/error.middleware');
const { connectDB } = require('./config/db');
const { initializeFirebase } = require('./config/firebase');

const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const boardRoutes = require('./routes/board.routes');
const aiRoutes = require('./routes/ai.routes');
const taskRoutes = require('./routes/task.routes');

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', authMiddleware);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/boards', aiRoutes);
app.use('/api', taskRoutes);

app.use(errorMiddleware);

const port = process.env.PORT || 5000;

async function start() {
  await connectDB();
  initializeFirebase();
  app.listen(port, () => {
    console.log(`TaskCan backend listening on port ${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = app;
