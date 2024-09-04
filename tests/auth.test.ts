import { signUp, logIn } from "lib/auth";

describe("Auth Module", () => {
  it("should return the new valid user after signup", () => {
    // todo start here: tdd for entire auth module. next pass in/mock callback for repo for signup
    // then get into jwt implementation?
    // ironside session lib: https://github.com/vvo/iron-session?tab=readme-ov-file
    // jose session lib: https://github.com/panva/jose
    // jest: https://jestjs.io/docs/using-matchers
    // next doc for where aut should happen: https://nextjs.org/docs/pages/building-your-application/authentication
    // create mock for db access
    const user = signUp();
    expect(user).toBeDefined();
    expect(user).toHaveProperty("firstName");
  });
});
