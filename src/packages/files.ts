import archiver from "archiver";
import { Router } from "express";
import { createWriteStream, existsSync } from "fs";
import { join } from "path";
import dataPath from "../data";

const filesRouter = Router();

const locked: string[] = [];

export async function updateZip(path: string) {
  if (locked.includes(path)) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!locked.includes(path)) {
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });
  }

  if (!existsSync(join(path, "package.zip"))) {
    console.log("Creating package.zip for", path);

    await new Promise((resolve, reject) => {
      const output = createWriteStream(join(path, "package.zip"));
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      output.on("close", resolve);
      archive.on("error", (err) => {
        reject(err);
      });

      archive.pipe(output);

      // ignore the package.zip file
      archive.glob("**/*", {
        ignore: ["package.zip"],
        cwd: path,
      });
      archive.finalize();
    });
  }
}

filesRouter.get("/:package/:version/package.zip", async (req, res) => {
  const basePath = join(
    dataPath,
    "packages",
    req.params.package,
    req.params.version
  );

  await updateZip(basePath);

  res.sendFile(join(basePath, "package.zip"));
});

export default filesRouter;
