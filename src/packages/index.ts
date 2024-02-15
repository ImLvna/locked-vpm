import { createHash } from "crypto";
import { createReadStream, readFileSync, readdirSync } from "fs";
import { join } from "path";
import dataPath, { getSource } from "../data";

type ListingPackageResponse = {
  [name: string]: {
    [version: string]: any;
  };
};

export function getListingPackages(): ListingPackageResponse {
  const baseUrl = getSource().url.replace("/index.json", "");

  return readdirSync(join(dataPath, "packages")).reduce((acc, name) => {
    const versions = readdirSync(join(dataPath, "packages", name))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.slice(0, -5));

    acc[name] = versions.reduce((acc, version) => {
      const packageMeta = JSON.parse(
        readFileSync(
          join(dataPath, "packages", name, `${version}.json`),
          "utf-8"
        )
      );

      packageMeta.url = `${baseUrl}/packages/${name}/${version}.zip`;

      const hash = createHash("sha256");
      createReadStream(join(dataPath, "packages", name, `${version}.zip`)).pipe(
        hash
      );
      packageMeta.zipSHA256 = hash.digest("hex");

      acc[version] = packageMeta;

      return acc;
    }, {} as ListingPackageResponse[string]);

    return acc;
  }, {} as ListingPackageResponse);
}
