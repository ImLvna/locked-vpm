import { Router } from "express";
import { canAccessPackage, hashPassword } from "../../security";
import packagesRouter from "./packages";

const adminRouter = Router();

adminRouter.use(async (req, res, next) => {
  if (!canAccessPackage("*", req.headers.authorization)) {
    return res.status(403).send("Invalid password");
  }
  next();
});
adminRouter.use("/packages", packagesRouter);

adminRouter.get("/", (req, res) => {
  res.send("Hello, admin!");
});

adminRouter.get("/hash", async (req, res) => {
  return res.send(await hashPassword(req.query.password as string));
});

export default adminRouter;
