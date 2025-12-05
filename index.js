const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");

// Initialisation
const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log("Serveur démarré sur le port " + PORT);
});
