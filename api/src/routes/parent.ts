import { Router } from "express";
import prisma from "../lib/prisma.js";
import { checkRole } from "../middlewares/rbac.js";

const router = Router();

router.use(checkRole(["PARENT", "ADMIN"]));

router.get("/student", async (req, res) => {
  const user = res.locals.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // For a real app, we'd look up the student linked to this parent
  // For demo, we just take the first student
  const student = await prisma.student.findFirst({
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      academics: {
        orderBy: [{ year: "desc" }, { semester: "desc" }]
      }
    }
  });

  if (!student) return res.status(404).json({ error: "No student found" });

  // Mock readiness score and deadlines for now
  res.json({
    id: student.id,
    name: student.user.name,
    email: student.user.email,
    readinessScore: 82,
    academics: student.academics.map(a => ({
        semester: a.semester,
        grade: 4.0, // simplified for chart
        courseName: a.courseName
    })),
    deadlines: [
        { date: '2023-11-01', title: 'Stanford Early Decision' },
        { date: '2023-12-15', title: 'UC Application' }
    ]
  });
});

export default router;
