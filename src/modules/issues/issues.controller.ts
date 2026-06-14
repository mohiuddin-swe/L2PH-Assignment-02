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



export const issueController = {
  createIssue,

};
