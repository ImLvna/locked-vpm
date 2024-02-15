import { Router } from "express";
import { getSource } from "./data";
import { getListingPackages } from "./packages";

const listingRouter = Router();

listingRouter.get("/", (req, res) => {
  const source = getSource();

  source.packages = getListingPackages();

  res.json(source);
});

export default listingRouter;
