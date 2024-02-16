import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { SecurityData } from "./security";

let dataPath: string;

function checkDir(path: string): boolean {
  if (existsSync(path) && statSync(path).isDirectory()) {
    dataPath = path;
    return true;
  }
  return false;
}

if (!checkDir("data") && !checkDir("../data") && !checkDir("/data")) {
  throw new Error("Data directory not found");
}
export default dataPath!;

export function getSource() {
  return JSON.parse(readFileSync(join(dataPath, "source.json"), "utf-8"));
}

export function getSecurityData(): SecurityData {
  return JSON.parse(readFileSync(join(dataPath, "security.json"), "utf-8"));
}
