import { pbkdf2 as _pbkdf2 } from "crypto";
import { promisify } from "util";
import { getSecurityData } from "./data";

const pbkdf2 = promisify(_pbkdf2);

type Password = string[] | true;

export interface SecurityData {
  salt: string;
  iterations: number;
  passwords: {
    [key: string]: Password;
  };
  publicPackages: string[];
}

export async function hashPassword(password: string) {
  const data = getSecurityData();
  const buf = await pbkdf2(password, data.salt, data.iterations, 64, "sha512");
  return buf.toString("hex");
}

export function canAccessPackage(
  packageName: string,
  hash: string | undefined
): boolean {
  const data = getSecurityData();
  if (data.publicPackages.includes(packageName)) {
    return true;
  }
  if (!hash) {
    return false;
  }
  const perms = data.passwords[hash];
  if (!perms) {
    return false;
  }
  if (perms === true) {
    return true;
  }
  return perms.includes(packageName);
}
