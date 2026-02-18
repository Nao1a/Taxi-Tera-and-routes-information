const express = require('express');
const cors = require('cors');
const connectDb = require('./config/dbConnection');
const dotenv = require('dotenv');
const userRoutes = require("./routes/userRoutes");
const searchRoutes = require('./routes/searchRoutes');
const errorHandler = require('./middleware/ErrorHandler');
const submissionRoutes = require('./routes/submissionRoutes');
const http = require('http');
const { Server } = require("socket.io");
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const hireRoutes = require('./routes/hireRoutes'); // We'll create this next
const { refreshGraph } = require('./controller/searchController');
dotenv.config({ path: require('path').join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

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

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

app.set('io', io); // Make io accessible in controllers

io.on("connection", (socket) => {
  // console.log(`User Connected: ${socket.id}`);

  socket.on("join_chat", (data) => {
    // Check if data is just the id string or an object
    const room = typeof data === 'object' && data !== null ? data.room : data;
    if (room) {
      socket.join(room); // room = hireRequestId
      // console.log(`User ${socket.id} joined room: ${room}`);
    } else {
      // console.log(`User ${socket.id} attempted to join invalid room`, data);
    }
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    // console.log("User Disconnected", socket.id);
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/hire', hireRoutes); // For applying and chatting logic

// Optional admin refresh endpoint (could protect with auth middleware)
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.post('/api/_admin/refresh-graph', async (req, res, next) => {
  try {
    await refreshGraph();
    res.json({ message: 'Graph refreshed' });
  } catch (e) { next(e); }
});


// Error handler last
app.use(errorHandler);

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await refreshGraph();
    console.log('Adjacency graph built with', Object.keys(global.adjGraph || {}).length, 'nodes');
    
  } catch (e) {
    console.error('Failed to build adjacency graph at startup:', e.message);
  }
});