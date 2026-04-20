import { Router } from "express";
import prisma from "../lib/prisma.js";
import { checkRole } from "../middlewares/rbac.js";

const router = Router();

router.use(checkRole(["COUNSELOR", "ADMIN"]));

router.get("/students", async (req, res) => {
  const user = res.locals.user;
  const where: any = {};
  
  if (user.role.toUpperCase() === "COUNSELOR") {
    where.counselorId = user.id;
  }

  console.log(`[COUNSELOR] Fetching students for ${user.role} ${user.id}...`);
  const students = await prisma.student.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      counselor: {
        select: {
          name: true
        }
      },
      academics: true
    }
  });

  console.log(`[COUNSELOR] Found ${students.length} students in DB`);

  // Calculate GPA for each student
  const gradePoints: Record<string, number> = {
    "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0.0
  };

  const studentsWithGpa = students.map(student => {
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
    
    let riskLevel = "Low";
    if (gpa < 2.0) riskLevel = "High";
    else if (gpa < 3.0) riskLevel = "Medium";

    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      gpa: parseFloat(gpa.toFixed(2)),
      riskLevel,
      grade: student.grade,
      counselorId: student.counselorId,
      counselorName: student.counselor?.name || "Unassigned",
      zipCode: student.zipCode,
      majorInterest: student.majorInterest
    };
  });

  res.json(studentsWithGpa);
});

router.get("/stats", async (req, res) => {
    const user = res.locals.user;
    const where: any = {};
    
    if (user.role.toUpperCase() === "COUNSELOR") {
      where.counselorId = user.id;
    }

    const students = await prisma.student.findMany({ 
        where,
        include: { academics: true } 
    });
    
    const gradePoints: Record<string, number> = {
        "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0.0
    };

    const gpas = students.map(student => {
        let totalPoints = 0;
        let totalCredits = 0;
        student.academics.forEach(r => {
            const base = gradePoints[r.grade || ""] || 0;
            const weight = r.isAP ? 1.0 : (r.isHonors ? 0.5 : 0.0);
            const credits = r.credits || 1;
            totalPoints += (base + weight) * credits;
            totalCredits += credits;
        });
        return totalCredits > 0 ? totalPoints / totalCredits : 0;
    }).filter(gpa => gpa > 0);

    const avgGpa = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;

    // Data for chart: GPA distribution
    const distribution = [
        { range: "0-1", count: gpas.filter(g => g < 1).length },
        { range: "1-2", count: gpas.filter(g => g >= 1 && g < 2).length },
        { range: "2-3", count: gpas.filter(g => g >= 2 && g < 3).length },
        { range: "3-4", count: gpas.filter(g => g >= 3 && g <= 4).length },
        { range: "4+", count: gpas.filter(g => g > 4).length },
    ];

    res.json({
        avgGpa: parseFloat(avgGpa.toFixed(2)),
        totalStudents: students.length,
        distribution
    });
});

export default router;
