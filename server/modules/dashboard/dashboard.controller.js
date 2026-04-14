import * as dashboardService from "./dashboard.service.js";
import { HTTP, MSG } from "../../utils/constants.js";

// ─── Response Helpers ──────────────────────────────────────────────────────
const ok   = (res, msg, data) => res.status(HTTP.OK).json({ success: true, message: msg, data });
const fail = (res, code, msg, errors) => {
  const body = { success: false, message: msg };
  if (errors?.length) body.errors = errors;
  return res.status(code).json(body);
};

// ─── Dashboard Overview ────────────────────────────────────────────────────

export async function getDashboardOverview(req, res) {
  try {
    const result = await dashboardService.getDashboardOverview(req.business.id);
    return ok(res, MSG.DASHBOARD_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}

// ─── Sales Chart ───────────────────────────────────────────────────────────

export async function getSalesChart(req, res) {
  try {
    const period = req.query.period || "30days";
    if (!["7days", "30days", "12months"].includes(period)) {
      return fail(res, HTTP.BAD_REQUEST, MSG.VALIDATION_ERROR, ["Period must be '7days', '30days', or '12months'."]);
    }

    const result = await dashboardService.getSalesChart(req.business.id, { period });
    return ok(res, MSG.DASHBOARD_FETCHED, result);
  } catch (err) {
    return fail(res, err.statusCode ?? HTTP.INTERNAL, err.message);
  }
}
