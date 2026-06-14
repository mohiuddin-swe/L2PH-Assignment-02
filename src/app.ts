import CookieParser from "cookie-parser";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import logger from "./middleware/logger";
import { userRoute } from "./modules/user/user.route";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoutes } from "./modules/issues/issues.route";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app: Application = express();

app.use(CookieParser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.get("/", (req: Request, res: Response) => {
  //res.send("Hello World!");
  res.status(200).json({
    message: "Express Server",
    author: "Next Level",
  });
});

app.use("/api/auth", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoutes);

// Global Error Handling Middleware
app.use(globalErrorHandler);



export default app;
