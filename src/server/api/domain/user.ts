import { type TrackableEntity } from "./trackableEntity";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  hashedPassword: string;
} & TrackableEntity;
