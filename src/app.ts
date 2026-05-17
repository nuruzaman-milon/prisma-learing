import express from "express";
import cors from "cors";

import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Server Running...");
});

app.use(globalErrorHandler);

export default app;
