import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authMiddleware } from "./middlewares/auth.js";
import authRoutes from "./routes/auth.js";
import academicRoutes from "./routes/academic.js";
import ecRoutes from "./routes/ec.js";
import collegeRoutes from "./routes/colleges.js";
import roadmapRoutes from "./routes/roadmap.js";
import documentRoutes from "./routes/documents.js";
import chatRoutes from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";
import counselorRoutes from "./routes/counselor.js";
import lorRoutes from "./routes/lor.js";
import scholarshipRoutes from "./routes/scholarships.js";
import visitRoutes from "./routes/visits.js";
import notificationRoutes from "./routes/notifications.js";
import parentRoutes from "./routes/parent.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
	origin: ["http://localhost:3000", "http://localhost:5173"],
	credentials: true,
	exposedHeaders: ["set-cookie"]
}));

app.use(express.json());
app.use((req, res, next) => {
	console.log(`[REQUEST] ${req.method} ${req.path}`);
	next();
});
app.use(authMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/ec", ecRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/counselor", counselorRoutes);
app.use("/api/lor", lorRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/parent", parentRoutes);

app.get("/api/health", (req, res) => {
	res.json({ status: "ok" });
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
