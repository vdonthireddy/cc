import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";

const router = Router();

const gradePoints: Record<string, number> = {
	"A": 4.0, "A-": 3.7,
	"B+": 3.3, "B": 3.0, "B-": 2.7,
	"C+": 2.3, "C": 2.0, "C-": 1.7,
	"D+": 1.3, "D": 1.0, "F": 0.0
};

const getStudentId = async (userId: number, role: string, targetStudentId?: string) => {
	const userRole = role.toUpperCase();
	if (userRole === "STUDENT") {
		const student = await prisma.student.findUnique({ where: { userId } });
		return student?.id;
	}
	if ((userRole === "ADMIN" || userRole === "COUNSELOR") && targetStudentId) {
		return parseInt(targetStudentId);
	}
	return null;
};

router.get("/", async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const studentId = await getStudentId(user.id, user.role, req.query.studentId as string);
	console.log(`[ACADEMIC GET] User: ${user.email}, Role: ${user.role}, Requested StudentId: ${req.query.studentId}, Resolved StudentId: ${studentId}`);
	
	if (!studentId) return res.status(400).json({ error: "Student ID required or not found" });

	const records = await prisma.academicRecord.findMany({
		where: { studentId },
		orderBy: [{ year: "desc" }, { semester: "desc" }]
	});

	console.log(`[ACADEMIC GET] Found ${records.length} records`);
	res.json(records);
});

const academicSchema = z.object({
	courseName: z.string(),
	grade: z.string().optional(),
	credits: z.number().optional(),
	semester: z.string(),
	year: z.number(),
	isAP: z.boolean().default(false),
	isHonors: z.boolean().default(false),
	studentId: z.number().optional()
});

router.post("/", async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const result = academicSchema.safeParse(req.body);
	if (!result.success) return res.status(400).json({ error: result.error.format() });

	let studentId = result.data.studentId;
	if (user.role.toUpperCase() === "STUDENT") {
		const student = await prisma.student.findUnique({ where: { userId: user.id } });
		if (!student) return res.status(404).json({ error: "Student record not found" });
		studentId = student.id;
	} else if (!studentId) {
		return res.status(400).json({ error: "studentId is required for non-students" });
	}

	const record = await prisma.academicRecord.create({
		data: {
			...result.data,
			studentId: studentId!
		}
	});

	res.status(201).json(record);
});

router.delete("/:id", async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const id = parseInt(req.params.id);
	const record = await prisma.academicRecord.findUnique({ where: { id } });
	if (!record) return res.status(404).json({ error: "Record not found" });

	if (user.role.toUpperCase() === "STUDENT") {
		const student = await prisma.student.findUnique({ where: { userId: user.id } });
		if (!student || record.studentId !== student.id) {
			return res.status(403).json({ error: "Forbidden" });
		}
	}

	await prisma.academicRecord.delete({ where: { id } });
	res.status(204).end();
});

router.get("/report-data", async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const studentId = await getStudentId(user.id, user.role, req.query.studentId as string);
	if (!studentId) return res.status(400).json({ error: "Student ID required or not found" });

	const records = await prisma.academicRecord.findMany({
		where: { studentId },
		orderBy: [{ year: "asc" }, { semester: "asc" }]
	});

	// Transform to trend data
	const trend = records.map(r => ({
		semester: `${r.semester} ${r.year}`,
		gpa: gradePoints[r.grade || ""] || 0,
		course: r.courseName
	}));

	res.json(trend);
});

router.get("/gpa", async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const studentId = await getStudentId(user.id, user.role, req.query.studentId as string);
	if (!studentId) return res.status(400).json({ error: "Student ID required or not found" });

	const records = await prisma.academicRecord.findMany({
		where: { studentId }
	});

	let hypothetical: any[] = [];
	try {
		if (req.query.hypothetical) {
			hypothetical = JSON.parse(req.query.hypothetical as string);
		}
	} catch (e) {}

	const allRecords = [...records, ...hypothetical];

	const calculateGPA = (recs: any[]) => {
		let totalPoints = 0;
		let totalCredits = 0;
		recs.forEach(r => {
			const base = gradePoints[r.grade || ""] || 0;
			const weight = r.isAP ? 1.0 : (r.isHonors ? 0.5 : 0.0);
			const credits = r.credits || 1;
			totalPoints += (base + weight) * credits;
			totalCredits += credits;
		});
		return totalCredits > 0 ? totalPoints / totalCredits : 0;
	};

	const currentGPA = calculateGPA(records);
	const potentialGPA = calculateGPA(allRecords);

	res.json({ 
		currentGPA: parseFloat(currentGPA.toFixed(2)), 
		potentialGPA: parseFloat(potentialGPA.toFixed(2)) 
	});
});

router.post("/generate-report", async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const studentId = await getStudentId(user.id, user.role, req.body.studentId);
	if (!studentId) return res.status(400).json({ error: "Student ID required or not found" });

	const config = await prisma.systemConfig.findFirst();
	const agentConfig = config?.agentConfig as any;
	if (!agentConfig?.report?.enabled) {
		return res.status(400).json({ error: "Report Generator is disabled" });
	}

	res.json({ message: "Report agent triggered", studentId });
});

export default router;
