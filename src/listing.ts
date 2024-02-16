import { Router } from "express";
import { getSource } from "./data";
import { getListingPackages } from "./packages";

const listingRouter = Router();

listingRouter.get("/", async (req, res) => {
  const source = getSource();

  source.packages = await getListingPackages();

  res.json(source);
});

export default listingRouter;
