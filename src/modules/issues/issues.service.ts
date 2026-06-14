import { pool } from "../../db";
import { type IIssue } from "./issues.interface";

const createIssueIntoDB = async (
  payload: IIssue,
  reporter_id: number
) => {
  const { title, description, type } = payload;

  const result = await pool.query(
    `
    INSERT INTO issues
    (title, description, type, reporter_id)
    VALUES ($1,$2,$3,$4)
    RETURNING *
    `,
    [title, description, type, reporter_id]
  );

  return result.rows[0];
};
const getAllIssuesFromDB = async (query: {
  sort?: string;
  type?: string;
  status?: string;
}) => {
  let sql = `
    SELECT *
    FROM issues
  `;

  const conditions: string[] = [];
  const values: string[] = [];

  // type filter
  if (query.type) {
    values.push(query.type);
    conditions.push(`type = $${values.length}`);
  }

  // status filter
  if (query.status) {
    values.push(query.status);
    conditions.push(`status = $${values.length}`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  // sorting
  if (query.sort === "oldest") {
    sql += ` ORDER BY created_at ASC`;
  } else {
    sql += ` ORDER BY created_at DESC`;
  }

  // Get issues
  const issuesResult = await pool.query(sql, values);

  const issues = issuesResult.rows;

  if (issues.length === 0) {
    return [];
  }

  // ----------------------------
  // Fetch reporters (NO JOIN)
  // ----------------------------

  const reporterIds = [
    ...new Set(
      issues.map((issue) => issue.reporter_id)
    ),
  ];

  const placeholders = reporterIds
    .map((_, index) => `$${index + 1}`)
    .join(",");

  const reportersResult = await pool.query(
    `
    SELECT
      id,
      name,
      role
    FROM users
    WHERE id IN (${placeholders})
    `,
    reporterIds
  );

  // Create reporter map

  const reporterMap: Record<number, any> = {};

  reportersResult.rows.forEach((user) => {
    reporterMap[user.id] = user;
  });

  // Attach reporter object

  const finalData = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,

    reporter: reporterMap[issue.reporter_id],

    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  return finalData;
};

const getSingleIssueFromDB = async (id: number) => {
  // Get the issue
  const issueResult = await pool.query(
    `
    SELECT *
    FROM issues
    WHERE id = $1
    `,
    [id]
  );

  if (issueResult.rows.length === 0) {
    return null;
  }

  const issue = issueResult.rows[0];

  // Get reporter information (NO JOIN)
  const reporterResult = await pool.query(
    `
    SELECT
      id,
      name,
      role
    FROM users
    WHERE id = $1
    `,
    [issue.reporter_id]
  );

  const reporter = reporterResult.rows[0];

  // Return formatted response
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: {
      id: reporter.id,
      name: reporter.name,
      role: reporter.role,
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

const updateIssueFromDB = async (
  payload: Partial<IIssue>,
  id: string,
  user: {
    id: number;
    role: string;
  }
) => {
  // Find issue
  const issueResult = await pool.query(
    `
    SELECT *
    FROM issues
    WHERE id=$1
    `,
    [id]
  );

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

  // Contributor rules
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("Forbidden");
    }

    if (issue.status !== "open") {
      throw new Error("Issue cannot be updated");
    }
  }

  const { title, description, type, status } = payload;

  const result = await pool.query(
    `
    UPDATE issues
    SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      status = COALESCE($4, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
    `,
    [
      title,
      description,
      type,
      status,
      id,
    ]
  );

  // Return exactly the updated issue
  return result.rows[0];
};

const deleteIssueFromDB = async (
  id: string,
  user: {
    role: string;
  }
) => {
  // Maintainer only
  if (user.role !== "maintainer") {
    throw new Error("Only maintainer can delete issues");
  }

  const result = await pool.query(
    `
    DELETE FROM issues
    WHERE id=$1
    `,
    [id]
  );

  return result.rowCount;
};

export const issueService = {
  createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
    updateIssueFromDB,
    deleteIssueFromDB
};