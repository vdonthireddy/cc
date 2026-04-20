import { Router } from "express";
import prisma from "../lib/prisma.js";
import { guardianAgent } from "../agents/guardianAgent.js";
import multer from "multer";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

const router = Router();
const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	}
});

const upload = multer({ storage });

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

router.get("/", async (req, res) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const student = await prisma.student.findUnique({
		where: { userId: user.id },
		include: { documents: true }
	});

	if (!student) return res.status(404).json({ error: "Student not found" });

	res.json(student.documents);
});

router.post("/upload", upload.single("file"), async (req, res) => {
	const user = res.locals.user;
	if (!user || !req.file) return res.status(400).json({ error: "Missing file or unauthorized" });

	const student = await prisma.student.findUnique({
		where: { userId: user.id }
	});

	if (!student) return res.status(404).json({ error: "Student not found" });

	// Check filename for sensitive content
	const guardianResult = guardianAgent(req.file.originalname);
	if (guardianResult.blocked) {
		// Delete the uploaded file if it's blocked
		fs.unlinkSync(req.file.path);
		
		await prisma.agentLog.create({
			data: {
				agentName: "guardian",
				studentId: student.id,
				status: "error",
				input: { filename: req.file.originalname },
				output: { reason: guardianResult.reason },
				error: guardianResult.reason
			}
		});
		return res.status(400).json({ error: guardianResult.reason });
	}

	const document = await prisma.document.create({
		data: {
			studentId: student.id,
			name: req.file.originalname,
			type: req.body.type || "other",
			url: req.file.filename
		}
	});

	res.json(document);
});

router.post("/share/:id", async (req, res) => {
	const { id } = req.params;
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const doc = await prisma.document.findUnique({
		where: { id: parseInt(id) }
	});

	if (!doc) return res.status(404).json({ error: "Document not found" });

	const token = jwt.sign({ fileId: doc.id }, JWT_SECRET, { expiresIn: "24h" });
	const shareLink = `${req.protocol}://${req.get("host")}/api/documents/download/${token}`;

	res.json({ shareLink });
});

router.get("/download-direct/:id", async (req, res) => {
	const { id } = req.params;
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const doc = await prisma.document.findUnique({
		where: { id: parseInt(id) }
	});

	if (!doc) return res.status(404).json({ error: "Document not found" });

	// Check if the document belongs to the student of the user
	const student = await prisma.student.findUnique({
		where: { userId: user.id }
	});

	if (!student || doc.studentId !== student.id) {
		return res.status(403).json({ error: "Forbidden" });
	}

	const filePath = path.resolve(uploadDir, doc.url);
	res.download(filePath, doc.name);
});

router.get("/download/:token", async (req, res) => {
	const { token } = req.params;
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as { fileId: number };
		const doc = await prisma.document.findUnique({
			where: { id: decoded.fileId }
		});

		if (!doc) return res.status(404).json({ error: "Document not found" });

		const filePath = path.resolve(uploadDir, doc.url);
		res.download(filePath, doc.name);
	} catch (error) {
		res.status(401).json({ error: "Invalid or expired link" });
	}
});

export default router;
