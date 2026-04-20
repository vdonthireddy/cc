import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
	const { q } = req.query;
	const colleges = await prisma.college.findMany({
		where: q ? {
			name: {
				contains: q as string
			}
		} : {},
		take: 10
	});

	// Mock data if empty
	if (colleges.length === 0) {
		return res.json([
			{ id: 1, name: "Stanford University", location: "CA", acceptRate: 0.04, sat25th: 1440, sat75th: 1570 },
			{ id: 2, name: "MIT", location: "MA", acceptRate: 0.07, sat25th: 1510, sat75th: 1580 },
			{ id: 3, name: "UC Berkeley", location: "CA", acceptRate: 0.15, sat25th: 1290, sat75th: 1530 }
		]);
	}

	res.json(colleges);
});

export default router;
