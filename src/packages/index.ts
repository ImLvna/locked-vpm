import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import dataPath, { getSource } from "../data";
import { sha256File } from "../utils/hash";
import { updateZip } from "./files";

type ListingPackageResponse = {
  [name: string]: ListingPackageVersions;
};

type ListingPackageVersions = {
  versions: {
    [version: string]: PackageMeta;
  };
};

type PackageMeta = {
  name: string;
  version: string;
  url: string;
  zipSHA256: string;
  [key: string]: any;
};

export async function getListingPackages(): Promise<ListingPackageResponse> {
  const baseUrl = getSource().url.replace("/index.json", "");

  const packages = await Promise.all(
    readdirSync(join(dataPath, "packages")).map(async (name) => {
      const versionDirs = readdirSync(join(dataPath, "packages", name));

      const versionsMeta = await Promise.all(
        versionDirs.map(async (version) => {
          const packageMeta: PackageMeta = JSON.parse(
            readFileSync(
              join(dataPath, "packages", name, version, "package.json"),
              "utf-8"
            )
          );

          packageMeta.url = `${baseUrl}/packages/${name}/${version}/package.zip`;

          await updateZip(join(dataPath, "packages", name, version));

          packageMeta.zipSHA256 = await sha256File(
            join(dataPath, "packages", name, version, "package.zip")
          );

          return packageMeta;
        })
      );

      return {
        versions: versionsMeta.reduce((acc, meta) => {
          acc[meta.version] = meta;
          return acc;
        }, {} as ListingPackageVersions["versions"]),
      };
    })
  );
  return packages.reduce((acc, pkg) => {
    acc[Object.values(pkg.versions)[0].name] = pkg;
    return acc;
  }, {} as ListingPackageResponse);
}
