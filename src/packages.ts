import archiver from "archiver";
import { createHash } from "crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  readFileSync,
  readdirSync,
} from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import dataPath, { getSource } from "./data";
import { canAccessPackage } from "./security";

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
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any;
};

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
