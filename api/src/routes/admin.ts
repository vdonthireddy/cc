import { Router } from "express";
import prisma from "../lib/prisma.js";
import { checkRole } from "../middlewares/rbac.js";

const router = Router();

// Only admins can access admin routes
router.use(checkRole(["ADMIN"]));

router.get("/config", async (req, res) => {
  let config = await prisma.systemConfig.findFirst();
  if (!config) {
    // Initialize default config if not exists
    config = await prisma.systemConfig.create({
      data: {
        encryptionKey: process.env.ENCRYPTION_KEY || "default-encryption-key",
      },
    });
  }
  res.json(config);
});

router.get("/counselors", async (req, res) => {
  const counselors = await prisma.user.findMany({
    where: { role: "COUNSELOR" },
    select: { id: true, name: true, email: true }
  });
  res.json(counselors);
});

router.post("/students", async (req, res) => {
  const { email, name, grade, zipCode, majorInterest, counselorId } = req.body;

  try {
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role: "STUDENT",
        passwordHash: "abc123", // Default password for demo
        student: {
          create: {
            grade: parseInt(grade),
            zipCode,
            majorInterest,
            counselorId: counselorId ? parseInt(counselorId) : null,
          }
        }
      }
    });
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/students/:id", async (req, res) => {
  const { counselorId, grade, zipCode, majorInterest } = req.body;
  const studentId = parseInt(req.params.id);

  try {
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        counselorId: counselorId ? parseInt(counselorId) : null,
        grade: grade ? parseInt(grade) : undefined,
        zipCode,
        majorInterest
      }
    });
    res.json(updatedStudent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/config", async (req, res) => {
  const { agentConfig, featureFlags, dataRetentionMonths } = req.body;
  
  let config = await prisma.systemConfig.findFirst();
  if (!config) {
    config = await prisma.systemConfig.create({
      data: {
        encryptionKey: process.env.ENCRYPTION_KEY || "default-encryption-key",
        agentConfig,
        featureFlags,
        dataRetentionMonths,
      },
    });
  } else {
    config = await prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        agentConfig,
        featureFlags,
        dataRetentionMonths,
        updatedBy: res.locals.user.id,
      },
    });
  }
  
  res.json(config);
});

export default router;
