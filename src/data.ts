import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "fs";
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

if (!existsSync(join(dataPath!, "uploads")))
  mkdirSync(join(dataPath!, "uploads"));

for (const dir of readdirSync(join(dataPath!, "uploads"))) {
  rmSync(join(dataPath!, "uploads", dir), { recursive: true, force: true });
}

export function getSource() {
  return JSON.parse(readFileSync(join(dataPath, "source.json"), "utf-8"));
}

export function getSecurityData(): SecurityData {
  return JSON.parse(readFileSync(join(dataPath, "security.json"), "utf-8"));
}
