import prisma from "../lib/prisma.js";

export const createAuditLog = async (params: {
	userId: number;
	action: string;
	targetType: string;
	targetId?: string;
	metadata?: any;
	ip?: string;
}) => {
	try {
		await prisma.auditLog.create({
			data: {
				userId: params.userId,
				action: params.action,
				targetType: params.targetType,
				targetId: params.targetId,
				metadata: params.metadata,
				ip: params.ip,
			},
		});
	} catch (error) {
		console.error("Failed to create audit log:", error);
	}
};
