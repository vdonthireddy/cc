import { Router } from "express";
import prisma from "../lib/prisma.js";
import { guardianAgent } from "../agents/guardianAgent.js";

const router = Router();

router.post("/", async (req, res) => {
	const user = res.locals.user;
	if (!user) return res.status(401).json({ error: "Unauthorized" });

	const student = await prisma.student.findUnique({
		where: { userId: user.id },
		include: {
			academics: true,
			extracurriculars: true
		}
	});

	if (!student) return res.status(404).json({ error: "Student not found" });

	const { prompt } = req.body;
	
	const guardianResult = guardianAgent(prompt);
	if (guardianResult.blocked) {
		await prisma.agentLog.create({
			data: {
				agentName: "guardian",
				studentId: student.id,
				status: "error",
				input: { prompt },
				output: { reason: guardianResult.reason },
				error: guardianResult.reason
			}
		});
		return res.status(400).json({ error: guardianResult.reason });
	}

	const context = {
		academics: student.academics,
		extracurriculars: student.extracurriculars,
		majorInterest: student.majorInterest,
		grade: student.grade
	};

	console.log("Mock Chat Context:", JSON.stringify(context, null, 2));

	// Mock LLM response
	let response = "I see you're interested in your future! How can I help you today?";
	if (prompt.toLowerCase().includes("cs") || prompt.toLowerCase().includes("computer science")) {
		response = "I see you're interested in CS! Have you considered taking AP Calculus BC? It's a key course for CS majors.";
	} else if (prompt.toLowerCase().includes("extracurricular") || prompt.toLowerCase().includes("ec")) {
		response = "Your extracurriculars look great. Adding a leadership role or a personal project could really make your application stand out.";
	}

	res.json({ response });
});

export default router;
