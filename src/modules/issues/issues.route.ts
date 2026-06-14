import { Router } from "express";
import { issueController } from "./issues.controller";
import auth  from "../../middleware/auth";

const router = Router();
router.post("/", auth("contributor", "maintainer"), issueController.createIssue);
router.get("/", auth("contributor", "maintainer"), issueController.getAllIssues);
router.get("/:id", auth("contributor", "maintainer"), issueController.getSingleIssue);

export const issueRoutes = router;
