import { Router } from "express";
import { hashPassword } from "../security";
import adminRouter from "./admin";
import { listingHandler } from "./listing";
import packagesRouter from "./packages";
const router = Router();

router.use(async (req, res, next) => {
  if (req.headers.authorization) {
    req.headers.authorization = await hashPassword(req.headers.authorization);
  }
  if (req.query.pass && typeof req.query.pass === "string") {
    req.headers.authorization = await hashPassword(req.query.pass);
  }
  next();
});

router.get("/", listingHandler);
router.get("/index.json", listingHandler);
router.use("/packages", packagesRouter);
router.use("/admin", adminRouter);

export default router;
