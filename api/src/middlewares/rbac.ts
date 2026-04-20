import { Request, Response, NextFunction } from "express";

export const checkRole = (roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const user = res.locals.user;
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		const upperRoles = roles.map(r => r.toUpperCase());
		const userRole = user.role.toUpperCase();

		if (!upperRoles.includes(userRole)) {
			return res.status(403).json({ message: "Forbidden" });
		}

		next();
	};
};
