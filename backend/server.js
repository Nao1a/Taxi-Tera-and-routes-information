const express = require('express');
const connectDb = require('./config/dbconnection');
const dotenv = require('dotenv');
const userRoutes = require("./routes/userRoutes");
const errorHandler = require('./middleware/ErrorHandler');
dotenv.config({ path: require('path').join(__dirname, '.env') });

const app = express();

const PORT = process.env.PORT || 3000;
connectDb();
app.use(express.json()); // Middleware to parse JSON bodies

// Routes
app.use("/api/users", userRoutes);


// Error handler last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});