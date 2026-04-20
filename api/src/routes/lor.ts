import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.post("/request", async (req, res) => {
  const { studentId, teacherName, teacherEmail, deadline } = req.body;
  
  const lor = await prisma.recommendationRequest.create({
    data: {
      studentId: parseInt(studentId),
      teacherName,
      teacherEmail,
      status: "requested",
      deadline: deadline ? new Date(deadline) : null,
    },
  });
  
  console.log(`Mock email sent to ${teacherEmail} for LoR request`);
  
  res.json(lor);
});

router.get("/", async (req, res) => {
  const user = res.locals.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  let where: any = {};
  
  if (user.role.toUpperCase() === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) return res.status(404).json({ error: "Student profile not found" });
    where = { studentId: student.id };
  } else if (req.query.studentId) {
    where = { studentId: parseInt(req.query.studentId as string) };
  }

  const requests = await prisma.recommendationRequest.findMany({
    where,
    include: { student: { include: { user: true } } }
  });
  res.json(requests);
});

export default router;
