import { RequestHandler } from "express";
import { getSource } from "../data";
import { getListingPackages } from "../packages";

export const listingHandler: RequestHandler = async (req, res) => {
  const source = getSource();

  const packages = await getListingPackages(req.headers.authorization);

  if (Object.keys(packages).length === 0) {
    return res.status(403).send("Invalid password");
  }
  source.packages = packages;

  return res.json(source);
};
