const express = require('express');
const connectDb = require('./config/dbconnection');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const app = express();

const PORT = process.env.PORT || 3000;
connectDb();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});