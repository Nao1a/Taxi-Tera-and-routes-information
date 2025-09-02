const express = require('express');
const cors = require('cors');
const connectDb = require('./config/dbConnection');
const dotenv = require('dotenv');
const userRoutes = require("./routes/userRoutes");
const searchRoutes = require('./routes/searchRoutes');
const errorHandler = require('./middleware/ErrorHandler');
const submissionRoutes = require('./routes/submissionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { refreshGraph } = require('./controller/searchController');
dotenv.config({ path: require('path').join(__dirname, '.env') });

const app = express();

const PORT = process.env.PORT || 5000;
connectDb();
app.use(express.json()); // Middleware to parse JSON bodies

// CORS: allow frontend origins
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,           // e.g., https://your-frontend.example.com
  'http://localhost:3000',               // local CRA dev server
  'https://taxi-tera-and-routes-information.vercel.app', // deployed frontend
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow non-browser requests (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'verifytoken'],
  credentials: false,
};
app.use(cors(corsOptions));

// Routes
app.use("/api/users", userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);

// Optional admin refresh endpoint (could protect with auth middleware)
app.post('/api/_admin/refresh-graph', async (req, res, next) => {
  try {
    await refreshGraph();
    res.json({ message: 'Graph refreshed' });
  } catch (e) { next(e); }
});


// Error handler last
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await refreshGraph();
    console.log('Adjacency graph built with', Object.keys(global.adjGraph || {}).length, 'nodes');
    
  } catch (e) {
    console.error('Failed to build adjacency graph at startup:', e.message);
  }
});