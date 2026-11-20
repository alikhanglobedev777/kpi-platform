import {expect,it} from "vitest";
import {hashPassword,verifyPassword} from "../../lib/auth/password";
it("hashes and verifies credentials",async()=>{const h=await hashPassword("a long password");expect(h).not.toContain("a long password");expect(await verifyPassword("a long password",h)).toBe(true);expect(await verifyPassword("incorrect",h)).toBe(false);});
