const express = require('express');
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