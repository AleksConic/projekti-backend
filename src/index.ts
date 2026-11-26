import "dotenv/config";
import express from "express";
import path from "path";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/tasks";

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/projekti", projectRoutes);
app.use("/api/zadaci", taskRoutes);

// Front-end (React build) se servira staticki iz public/
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(publicDir, "index.html")));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Server radi na http://localhost:${port}`));
