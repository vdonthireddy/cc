import { Request, Response } from "express";
import { lucia } from "../lib/lucia.js";
import prisma from "../lib/prisma.js";
import argon2 from "argon2";
import { z } from "zod";
import { createAuditLog } from "../utils/audit.js";

const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().min(2),
	role: z.enum(["student", "parent", "counselor", "admin"]),
});

export const register = async (req: Request, res: Response) => {
	try {
		const result = registerSchema.safeParse(req.body);
		if (!result.success) {
			return res.status(400).json({ error: result.error.format() });
		}

		const { email, password, name, role } = result.data;

		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return res.status(400).json({ error: "Email already in use" });
		}

		const user = await prisma.user.create({
			data: {
				email,
				passwordHash: password,
				name,
				role,
			},
		});

		const session = await lucia.createSession(Number(user.id), {});
		res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());

		console.log(`[AUTH SUCCESS] User: ${user.name}, Role: ${user.role}, Email: ${user.email}`);

		await createAuditLog({
			userId: user.id,
			action: "REGISTER",
			targetType: "User",
			targetId: user.id.toString(),
			ip: req.ip,
		});

		return res.status(201).json({ 
			user: { 
				id: user.id, 
				email: user.email, 
				name: user.name, 
				role: user.role.toUpperCase() 
			} 
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export const login = async (req: Request, res: Response) => {
	try {
		const result = loginSchema.safeParse(req.body);
		if (!result.success) {
			return res.status(400).json({ error: result.error.format() });
		}

		const { email, password } = result.data;

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user || !user.passwordHash) {
			return res.status(400).json({ error: "Invalid email or password" });
		}

		// Plain text comparison for the demo
		const validPassword = user.passwordHash === password;
		if (!validPassword) {
			return res.status(400).json({ error: "Invalid email or password" });
		}

		const session = await lucia.createSession(Number(user.id), {});
		res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());

		console.log(`[AUTH SUCCESS] User: ${user.name}, Role: ${user.role}, Email: ${user.email}`);

		await createAuditLog({
			userId: user.id,
			action: "LOGIN",
			targetType: "User",
			targetId: user.id.toString(),
			ip: req.ip,
		});

		return res.json({ 
			user: { 
				id: user.id, 
				email: user.email, 
				name: user.name, 
				role: user.role.toUpperCase() 
			} 
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

export const logout = async (req: Request, res: Response) => {
	const session = res.locals.session;
	if (!session) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	await lucia.invalidateSession(session.id);
	res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());

	return res.status(204).end();
};

export const me = async (req: Request, res: Response) => {
	const user = res.locals.user;
	if (!user) {
		console.log("[AUTH ME] No user found in res.locals");
		return res.status(401).json({ error: "Unauthorized" });
	}

	console.log(`[AUTH ME] User: ${user.name}, Role: ${user.role}`);

	if (user.role.toUpperCase() === "STUDENT") {
		const student = await prisma.student.findUnique({
			where: { userId: Number(user.id) }
		});
		if (student) {
			return res.json({ user: { ...user, role: user.role.toUpperCase(), studentId: student.id } });
		}
	}

	return res.json({ user: { ...user, role: user.role.toUpperCase() } });
};
