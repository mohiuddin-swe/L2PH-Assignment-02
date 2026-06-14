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

const updateIssue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Issue id is required",
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const result = await issueService.updateIssueFromDB(
      req.body,
      id,
      {
        id: req.user.id,
        role: req.user.role,
      }
    );

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: any) {
    let statusCode = 500;

    switch (error.message) {
      case "Issue not found":
        statusCode = 404;
        break;

      case "Unauthorized":
        statusCode = 401;
        break;

      case "Forbidden":
        statusCode = 403;
        break;

      case "Issue cannot be updated":
        statusCode = 409;
        break;

      default:
        statusCode = 500;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
};
 
