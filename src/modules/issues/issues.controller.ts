import type { Request, Response } from "express";
import { issueService } from "./issues.service";


const createIssue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const reporter_id = req.user?.id;

    if (!reporter_id) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await issueService.createIssueIntoDB(
      req.body,
      reporter_id
    );

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSingleIssue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid issue id",
      });
      return;
    }

    const result = await issueService.getSingleIssueFromDB(id);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Issue not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Issue retrived successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,

};
