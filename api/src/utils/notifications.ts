import prisma from "../lib/prisma.js";

export async function createNotification(userId: number, title: string, message: string, type: "info" | "warning" | "error" | "success" = "info") {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type
    }
  });
}
