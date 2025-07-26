import httpStatusCodes from "http-status-codes";
import IController from "../Types/IController";
import apiResponse from "../utilities/ApiResponse";
import HealthCheckService from "../Services/HealthCheck.service";
import LOGGER from "../config/LOGGER";

const healthCheck: IController = async (req, res) => {
  LOGGER.info("Entered into healthCheck");

  try {
    LOGGER.info("Checking database health status");
    const dbStatus = await HealthCheckService.healthCheck();

    if (dbStatus instanceof Error) {
      LOGGER.error(`Database health check failed: ${dbStatus.message}`);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Database health check failed.");
    } else {
      LOGGER.info("Database is healthy");
      return apiResponse.result(res, {}, httpStatusCodes.OK);
    }
  } catch (error: any) {
    LOGGER.error("Error in healthCheck => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};


export default {
  healthCheck
}
