import express from "express";
import { initDb } from "./config/db";
import authRoutes from "./routes/auth.routes.js";

const app = express();


app.use(express.json());



const port = Number(process.env.PORT) || 3000;


app.use('/api/auth', authRoutes)

const startServer = async () => {
    try {
        await initDb();
        console.log("✅ Database initialized");

        app.listen(port, () => {
            console.log(`🚀 Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("❌ Failed to start the server:", error);
        process.exit(1);
    }
};

startServer();