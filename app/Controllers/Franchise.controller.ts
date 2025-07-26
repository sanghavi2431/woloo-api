import FranchiseService from "../Services/Franchise.service";
import httpStatusCodes from "http-status-codes";
import IController from "../Types/IController";
import apiResponse from "../utilities/ApiResponse";
import LOGGER from "../config/LOGGER";

const getAllFranchise: IController = async (req, res) => {
  LOGGER.info("Entered into getAllFranchise");

  try {
    let query = "WHERE w.is_franchise=1 ";
    LOGGER.info("Default query: WHERE w.is_franchise=1");

    if (req.body.query && req.body.query.trim() !== "") {
      query = `WHERE w.is_franchise=1 AND ( w.code LIKE '%${req.body.query}%' OR w.name LIKE '%${req.body.query}%' OR w.title LIKE '%${req.body.query}%' OR w.status LIKE '%${req.body.query}%' OR w.address LIKE '%${req.body.query}%' OR w.pincode LIKE '%${req.body.query}%')`;
      LOGGER.info(`Modified query based on search term: ${query}`);
    }

    LOGGER.info(
      `Fetching franchises with pageSize: ${req.body.pageSize}, pageIndex: ${req.body.pageIndex}, sort: ${req.body.sort}`
    );

    const result = await FranchiseService.getAllFranchise(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query
    );
    const count = await FranchiseService.getAllFranchiseCOunt(query);

    if (result instanceof Error) {
      LOGGER.error(`Error from FranchiseService: ${result.message}`);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info(
        `Successfully fetched franchises. Total count: ${count}, Result: ${JSON.stringify(result)}`
      );
      return apiResponse.result(
        res,
        { data: result, total: count },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getAllFranchise => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

export default{
    getAllFranchise
}