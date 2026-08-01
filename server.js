import express from "express";
import cors from "cors";

import chatRoutes from "./routes/chat.routes.js";
import propertyRoutes from "./routes/property.routes.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());



// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/properties", propertyRoutes);


// Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AI API is running."
    });
});

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});