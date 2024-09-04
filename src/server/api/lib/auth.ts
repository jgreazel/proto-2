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
 * conceptually:
 * avoid calling this a service/manager anything. Want auth to be outside of service hierarchy, able to be called from anywhere
 */

import { type User } from "domain/user";

export function signUp(): User {
  // ensure valid user data
  // store user with callback
  // with default role? (or dont mess with role/claims yet just figure out jwt session)
  // in that case, generate session token, append it to User obj to return
  // not sure if it needs added to User entity or just added to contexts/headers automatically?
  // is there a way to hide all this header/context setting? or should I intentionally place it here with intent to be used by framework

  return {
    firstName: "jon",
    lastName: "greazel",
  } as User;
}

export function logIn(): User {
  throw new Error("not implemented");
}
