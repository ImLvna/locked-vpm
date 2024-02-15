import express from "express";
import listingRouter from "./listing";
import filesRouter from "./packages/files";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).send("No authorization header found");
  }
  if (req.headers.authorization !== process.env.AUTHENTICATION) {
    return res.status(403).send("Invalid authorization header");
  }
  next();
});

app.use("/", listingRouter);
app.use("/index.json", listingRouter);
app.use("/files", filesRouter);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
