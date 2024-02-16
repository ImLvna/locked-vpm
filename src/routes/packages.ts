import { Router } from "express";
import { existsSync } from "fs";
import { join, resolve } from "path";
import semv from "semver";
import dataPath from "../data";
import { getListingPackages, updateZip } from "../packages";

const packagesRouter = Router();

packagesRouter.get("/:package", async (req, res) => {
  const packages = await getListingPackages(req.headers.authorization);
  const packageVersions = packages[req.params.package];
  if (!packageVersions) {
    return res.status(404).send("Package not found");
  }
  res.json(packageVersions);
});

packagesRouter.get("/:package/versions", async (req, res) => {
  const packages = await getListingPackages(req.headers.authorization);
  const packageVersions = packages[req.params.package];
  if (!packageVersions) {
    return res.status(404).send("Package not found");
  }
  res.json({ versions: Object.keys(packageVersions.versions) });
});

packagesRouter.get("/:package/:version", async (req, res) => {
  const packages = await getListingPackages(req.headers.authorization);
  const packageVersions = packages[req.params.package];
  if (!packageVersions) {
    return res.status(404).send("Package not found");
  }
  if (req.params.version === "latest") {
    let latestVersion = packageVersions.versions[0].version;
    for (const version of Object.keys(packageVersions.versions)) {
      if (semv.gt(version, latestVersion)) latestVersion = version;
    }
    return res.json(packageVersions.versions[latestVersion]);
  }

  if (!packageVersions.versions[req.params.version]) {
    return res.status(404).send("Version not found");
  }
  res.json(packageVersions.versions[req.params.version]);
});

packagesRouter.get("/:package/:version/package.zip", async (req, res) => {
  const basePath = join(
    dataPath,
    "packages",
    req.params.package,
    req.params.version
  );

  if (!existsSync(basePath)) {
    return res.status(404).send("Package not found");
  }

  await updateZip(basePath);

  res.sendFile(resolve(join(basePath, "package.zip")));
});

export default packagesRouter;
