import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.post("/", async (req, res) => {
  const { studentId, collegeId, visitDate, notes } = req.body;
  
  const visit = await prisma.collegeVisit.create({
    data: {
      studentId: parseInt(studentId),
      collegeId: parseInt(collegeId),
      visitDate: new Date(visitDate),
      notes,
    },
  });
  
  // Update demonstrated interest score
  const studentCollege = await prisma.studentCollege.findUnique({
    where: {
      studentId_collegeId: { 
        studentId: parseInt(studentId), 
        collegeId: parseInt(collegeId) 
      }
    }
  });
  
  if (studentCollege) {
    await prisma.studentCollege.update({
      where: { id: studentCollege.id },
      data: {
        demonstratedInterest: { increment: 10 }
      }
    });
  } else {
    // If not in saved colleges, add it with some interest
    await prisma.studentCollege.create({
      data: {
        studentId: parseInt(studentId),
        collegeId: parseInt(collegeId),
        demonstratedInterest: 10
      }
    });
  }
  
  res.json(visit);
});

export default router;
