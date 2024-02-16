import { createHash } from "crypto";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";

export async function sha256File(path: string) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}
