/**
 * ! Auth use cases:
 * log in / out
 * auth token is jwt in http context
 * jwt contains claims to permissions
 * get user info / details
 * get all users
 * create new user as current user
 * sign up
 * set a users permissions / claims
 * update user permissions / claims
 * check does user X's session contain permission Y
 *
 * high-level req:
 * will utilize basic check in middleware for private procedures
 * will need to check inside router functions for permissions if necessary
 * UI differences (nav options) will be returned from server side to client as dto
 * things involving a session check should happen optimistically with getServerSideProps (or next equiv)
 * next js middleware will need to utilize this to check for auth every request & place important things in context
 * needs client side functions for storing session in browser, auto adding to request, check session exp - logic lives here, comp/hooks live in react project
 * client flow: no/expired cookie in browser? login page. extract and store session from response. auto append it on every request if not expired
 * delete cookie from browser if bad response received / logout
 *
 * ? dependencies:
 * db access, userRepo
 * - currently prisma passed in req context
 *
 * current implementation plan:
 * pure functions with call back params to manage dependencies
 * need DTOs for i/o
 * mock callbacks with jest
 * example interface to follow along: https://chatgpt.com/c/90dc69db-260c-459a-8c4f-b133806006e2
 *
 * plan to implement as-is module with idea for connection string-esque configuration, rather than inserting every depend-function
 *
 * conceptually:
 * avoid calling this a service/manager anything. Want auth to be outside of service hierarchy, able to be called from anywhere
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let prisma: PrismaClient | null = null;

export const configurePrismaClient = (client?: PrismaClient) => {
  prisma = client ?? new PrismaClient();
  return prisma;
};

export const getPrismaClient = () => {
  if (!prisma) {
    throw new Error(
      "PrismaClient is not configured. Call configurePrismaClient first.",
    );
  }
  return prisma;
};

export type Permission =
  | "SALES_DESK"
  | "INVENTORY"
  | "PASSES"
  | "TIME"
  | "SETTINGS";
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}
// export interface User {
//   id: string;
//   username: string;
//   email?: string;
//   password: string;
//   roles: Role[];
// }

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function signUp(
  prisma: PrismaClient,
  username: string,
  password: string,
): Promise<User> {
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return user;
}

// todo resume per this conversation: https://chatgpt.com/share/b120680a-1e39-48ae-ad22-79f2c3ff59c6
