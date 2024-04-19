import type { User } from "@clerk/nextjs/dist/types/server";

export const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    imageUrl: user.imageUrl,
    firstName: user.firstName,
    lastName: user.lastName,
    emails: user.emailAddresses.map((e) => e.emailAddress),
  };
};
