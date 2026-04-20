import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	let studentId: number | null = null;
	
	if (user.role.toUpperCase() === "STUDENT") {
		const student = await prisma.student.findUnique({ where: { userId: user.id } });
		studentId = student?.id || null;
	} else if ((user.role.toUpperCase() === "ADMIN" || user.role.toUpperCase() === "COUNSELOR") && req.query.studentId) {
		studentId = parseInt(req.query.studentId as string);
	}

	if (!studentId) return res.status(404).json({ error: "Student not found or studentId missing" });

	const student = await prisma.student.findUnique({
		where: { id: studentId },
		include: { academics: true }
	});

	if (!student) return res.status(404).json({ error: "Student not found" });

	const recommendations = [];

	// Rule: If Student.majorInterest === 'CS' AND Student.grade === 10 -> Recommend 'AP CS A' for 11th grade
	if (student.majorInterest === "CS" && student.grade === 10) {
		recommendations.push({
			year: 11,
			course: "AP Computer Science A",
			reason: "To strengthen your CS foundation for college applications."
		});
	}

	// Simple vertical list of years/courses
	const roadmap = [
		{ year: 9, courses: ["Algebra II Honors", "English 9 Honors", "Biology Honors", "Spanish I", "World History"] },
		{ year: 10, courses: ["Pre-Calculus Honors", "English 10 Honors", "Chemistry Honors", "Spanish II", "AP World History"] },
		{ year: 11, courses: ["AP Calculus AB", "AP Physics 1", "English 11 AP Lang", "Spanish III", "AP US History"] },
		{ year: 12, courses: ["AP Calculus BC", "AP Physics C", "English 12 AP Lit", "Spanish IV Honors", "AP Gov/Econ"] }
	];

	// Merge recommendations
	recommendations.forEach(rec => {
		const year = roadmap.find(r => r.year === rec.year);
		if (year) {
			year.courses.push(`* ${rec.course} (Recommended)`);
		}
	});

	res.json(roadmap);
});

export default router;
