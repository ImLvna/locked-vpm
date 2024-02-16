import { Router } from "express";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
} from "fs";
import { rename, rm } from "fs/promises";
import multer from "multer";
import { join } from "path";
import { Extract } from "unzipper";
import dataPath from "../../data";
import { PackageMeta } from "../packages";

const uploadRouter = Router();

const upload = multer({ dest: join(dataPath, "uploads") });

uploadRouter.get("/", (req, res) => {
  res.send("Hello, admin!");
});

uploadRouter.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const temp = await mkdtempSync(join(dataPath, "uploads", "temp-"));

  try {
    await new Promise((resolve, reject) => {
      createReadStream(req.file!.path)
        .pipe(Extract({ path: temp }))
        .on("close", resolve)
        .on("error", reject);
    });

    if (!existsSync(join(temp, "package.json"))) {
      return res.status(400).send("No package.json found in the zip file.");
    }

    const packageMeta: PackageMeta = JSON.parse(
      readFileSync(join(temp, "package.json"), "utf-8")
    );

    if (!packageMeta.name || !packageMeta.version) {
      return res.status(400).send("Invalid package.json");
    }

    const packagePath = join(dataPath, "packages", packageMeta.name);

    if (!existsSync(packagePath)) {
      mkdirSync(packagePath);
    }

    if (existsSync(join(packagePath, packageMeta.version))) {
      console.log(
        "Removing existing package",
        packageMeta.name,
        packageMeta.version
      );
      await rm(join(packagePath, packageMeta.version), {
        recursive: true,
        force: true,
      });
    }

    await rename(temp, join(packagePath, packageMeta.version));

    console.log("Uploaded", packageMeta.name, packageMeta.version);

    res.json(packageMeta);
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
  if (existsSync(req.file.path)) {
    await rm(req.file.path);
  }

  if (existsSync(temp)) {
    await rm(temp, { recursive: true, force: true });
  }
});

export default uploadRouter;
