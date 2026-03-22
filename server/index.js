import dotenv from "dotenv"
import express from "express";
import { initializeDB } from "./config/db.js";

dotenv.config()

const app = express();


app.use(express.json());

const PORT = process.env.PORT || 3000;


// app.use('/api/auth', authRoutes)

const startServer = async () => {
    try {
        await initializeDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
};

startServer();