import { lucia } from "../lib/lucia.js";
import { Request, Response, NextFunction } from "express";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	const cookieHeader = req.headers.cookie || "";
	console.log(`[AUTH MIDDLEWARE] Cookie Header: ${cookieHeader ? "Present" : "Empty"}`);
	
	const sessionId = lucia.readSessionCookie(cookieHeader);
	if (!sessionId) {
		res.locals.user = null;
		res.locals.session = null;
		return next();
	}

	console.log(`[AUTH MIDDLEWARE] Found Session ID: ${sessionId.substring(0, 5)}...`);
	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
	}
	if (!session) {
		res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
	}
	res.locals.user = user;
	res.locals.session = session;
	return next();
};
