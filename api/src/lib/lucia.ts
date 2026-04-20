import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import prisma from "./prisma.js";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax"
		}
	},
	getUserAttributes: (attributes) => {
		return {
			email: attributes.email,
			role: attributes.role,
			name: attributes.name
		};
	}
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
		UserId: number;
	}
}

interface DatabaseUserAttributes {
	email: string;
	role: string;
	name: string;
}
