import { createHash } from "crypto";
import { createReadStream, existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import dataPath, { getSource } from "../../data";
import { canAccessPackage } from "../../security";
import { updateZip } from "./files";

type ListingPackageResponse = {
  [name: string]: ListingPackageVersions;
};

type ListingPackageVersions = {
  versions: {
    [version: string]: PackageMeta;
  };
};

export type PackageMeta = {
  name: string;
  version: string;
  url: string;
  zipSHA256: string;
  [key: string]: any;
};

export async function getListingPackages(
  password: string | undefined
): Promise<ListingPackageResponse> {
  const baseUrl = getSource().url.replace("/index.json", "");

  const packages = await Promise.all(
    readdirSync(join(dataPath, "packages")).map(async (name) => {
      if (!canAccessPackage(name, password)) return;
      const versionDirs = readdirSync(join(dataPath, "packages", name));

      const versionsMeta = await Promise.all(
        versionDirs.map(async (version) => {
          if (
            !existsSync(
              join(dataPath, "packages", name, version, "package.json")
            )
          )
            return;
          const packageMeta: PackageMeta = JSON.parse(
            readFileSync(
              join(dataPath, "packages", name, version, "package.json"),
              "utf-8"
            )
          );

          packageMeta.url = `${baseUrl}/packages/${name}/${version}/package.zip`;

          await updateZip(join(dataPath, "packages", name, version));

          const hash = createHash("sha256");
          await pipeline(
            createReadStream(
              join(dataPath, "packages", name, version, "package.zip")
            ),
            hash
          );
          packageMeta.zipSHA256 = hash.digest("hex");

          return packageMeta;
        })
      );

      return {
        versions: versionsMeta.reduce((acc, meta) => {
          if (!meta) return acc;
          acc[meta.version] = meta;
          return acc;
        }, {} as ListingPackageVersions["versions"]),
      };
    }) as Promise<ListingPackageVersions>[]
  );
  return packages
    .filter(Boolean)
    .filter((i) => Object.keys(i.versions).length > 0)
    .reduce((acc, pkg) => {
      acc[Object.values(pkg.versions)[0].name] = pkg;
      return acc;
    }, {} as ListingPackageResponse);
}
