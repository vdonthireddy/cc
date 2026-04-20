import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { runScoutAgent } from "../agents/scoutAgent.js";

const router = Router();

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
	console.log(`[EC GET] User: ${user.email}, Role: ${user.role}, Requested StudentId: ${req.query.studentId}, Resolved StudentId: ${studentId}`);

	if (!studentId) return res.status(400).json({ error: "Student ID required or not found" });

	const ecs = await prisma.extracurricular.findMany({
		where: { studentId },
		orderBy: { createdAt: "desc" }
	});

	console.log(`[EC GET] Found ${ecs.length} records`);
	res.json(ecs);
});

router.post("/find-clubs", async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const studentId = await getStudentId(user.id, user.role, req.body.studentId);
	if (!studentId) return res.status(400).json({ error: "Student ID required or not found" });

	const config = await prisma.systemConfig.findFirst();
	const agentConfig = config?.agentConfig as any;
	if (!agentConfig?.scout?.enabled) {
		return res.status(400).json({ error: "Opportunity Scout is disabled" });
	}

	// Run synchronously for now to remove Redis dependency
	runScoutAgent(studentId).catch(console.error);

	res.json({ message: "Scout agent triggered", studentId });
});

const ecSchema = z.object({
	name: z.string(),
	role: z.string().optional(),
	impactDescription: z.string().optional(),
	hoursPerWeek: z.number().optional(),
	weeksPerYear: z.number().optional(),
	proofUrl: z.string().optional(),
	studentId: z.number().optional()
});

router.post("/", async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const result = ecSchema.safeParse(req.body);
	if (!result.success) return res.status(400).json({ error: result.error.format() });

	let studentId = result.data.studentId;
	if (user.role.toUpperCase() === "STUDENT") {
		const student = await prisma.student.findUnique({ where: { userId: user.id } });
		if (!student) return res.status(404).json({ error: "Student record not found" });
		studentId = student.id;
	} else if (!studentId) {
		return res.status(400).json({ error: "studentId is required for non-students" });
	}

	const ec = await prisma.extracurricular.create({
		data: {
			...result.data,
			studentId: studentId!
		}
	});

	res.status(201).json(ec);
});

router.delete("/:id", async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const id = parseInt(req.params.id);
	const ec = await prisma.extracurricular.findUnique({ where: { id } });
	if (!ec) return res.status(404).json({ error: "Record not found" });

	if (user.role.toUpperCase() === "STUDENT") {
		const student = await prisma.student.findUnique({ where: { userId: user.id } });
		if (!student || ec.studentId !== student.id) {
			return res.status(403).json({ error: "Forbidden" });
		}
	}

	await prisma.extracurricular.delete({ where: { id } });
	res.status(204).end();
});

export default router;
