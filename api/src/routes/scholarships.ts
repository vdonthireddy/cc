import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const { studentId } = req.query;
  
  const scholarships = await prisma.scholarship.findMany();
  
  if (studentId) {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId as string) },
      include: { academics: true }
    });
    
    if (student) {
      // Simple rules engine
      // Calculate GPA
      const gradePoints: Record<string, number> = {
        "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0.0
      };
      
      let totalPoints = 0;
      let totalCredits = 0;
      student.academics.forEach(r => {
        const base = gradePoints[r.grade || ""] || 0;
        const weight = r.isAP ? 1.0 : (r.isHonors ? 0.5 : 0.0);
        const credits = r.credits || 1;
        totalPoints += (base + weight) * credits;
        totalCredits += credits;
      });
      const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
      
      const matched = scholarships.filter(s => {
        if (s.minGpa && gpa < s.minGpa) return false;
        // Rules engine: "If GPA > 3.5 -> Show 'Academic Excellence Scholarship'"
        if (s.name === "Academic Excellence Scholarship" && gpa <= 3.5) return false;
        return true;
      });
      
      return res.json(matched);
    }
  }
  
  res.json(scholarships);
});

export default router;
