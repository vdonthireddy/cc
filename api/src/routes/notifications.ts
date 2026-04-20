import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const userId = res.locals.user.id;
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  res.json(notifications);
});

router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;
  const userId = res.locals.user.id;
  
  await prisma.notification.updateMany({
    where: { id: parseInt(id), userId },
    data: { read: true }
  });
  
  res.sendStatus(204);
});

export default router;
