import httpStatusCodes from "http-status-codes";
import IController from "../Types/IController";
import apiResponse from "../utilities/ApiResponse";
import CorporateService from "../Services/Corporate.service";
import constants from "../Constants";
import LOGGER from "../config/LOGGER";

const addCorporate: IController = async (req, res) => {
  LOGGER.info("Entered into addCorporate");
  
  let corporate;
  try {
    LOGGER.info(`Adding corporate with details: ${JSON.stringify(req.body)}`);
    
    corporate = await CorporateService.addCorporate(req.body);
    LOGGER.info(`CorporateService response: ${JSON.stringify(corporate)}`);
    
    if (corporate instanceof Error) {
      LOGGER.error(`Error from CorporateService: ${corporate.message}`);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        corporate.message
      );
    } else {
      LOGGER.info("Successfully added corporate");
      return apiResponse.result(
        res,
        { corporate },
        httpStatusCodes.CREATED
      );
    }
  } catch (e: any) {
    LOGGER.error("Error in addCorporate => ", e);

    // @ts-ignore
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry detected");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
    }

    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const getCorporates: IController = async (req, res) => {
  LOGGER.info("Entered into getCorporates");
  
  try {
    LOGGER.info(`Fetching corporates with query: ${req.body.query}`);
    
    let query = " ";
    if (req.body.query != "") {
      query = ` WHERE ( name like '%${req.body.query}%' OR email like '%${req.body.query}%' OR contact_name like '%${req.body.query}%' OR mobile like '%${req.body.query}%' ) `;
      LOGGER.info(`Constructed SQL query: ${query}`);
    }

    const result = await CorporateService.getAllCorporate(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query
    );

    LOGGER.info(`CorporateService getAllCorporate response: ${JSON.stringify(result)}`);
    
    const count = await CorporateService.getAllCorporateCount(query);
    LOGGER.info(`CorporateService getAllCorporateCount response: ${count}`);
    
    if (result instanceof Error) {
      LOGGER.error(`Error from CorporateService: ${result.message}`);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully retrieved corporates");
      return apiResponse.result(
        res,
        { data: result, total: count },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getCorporates => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const deleteCorporatesById: IController = async (req, res) => {
  LOGGER.info("Entered into deleteCorporatesById");

  try {
    if (req.query.id) {
      const id = Number(req.query.id);
      LOGGER.info(`Deleting corporate with ID: ${id}`);

      const result: any = await CorporateService.deleteCorporatesById(id);

      if (result instanceof Error) {
        LOGGER.error(`Error from CorporateService: ${result.message}`);
        return apiResponse.error(
          res,
          httpStatusCodes.BAD_REQUEST,
          result.message
        );
      } else {
        LOGGER.info(`Successfully deleted corporate with ID: ${id}`);
        return apiResponse.result(res, result, httpStatusCodes.OK);
      }
    } else {
      LOGGER.error("Missing ID in request query");
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        "Please enter ID"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in deleteCorporatesById => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const fetchCorporatesById: IController = async (req, res) => {
  LOGGER.info("Entered into fetchCorporatesById");

  try {
    if (!req.query.id) {
      LOGGER.warn("Missing ID in request query");
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        "Please provide a valid ID"
      );
    }

    const id = req.query.id;
    LOGGER.info(`Fetching corporate with ID: ${id}`);

    const corporate: any = await CorporateService.fetchCorporatesById(id);

    if (corporate instanceof Error) {
      LOGGER.error(`Error from CorporateService: ${corporate.message}`);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        corporate.message
      );
    } else {
      LOGGER.info(`Successfully fetched corporate with ID: ${id}`);
      return apiResponse.result(res, corporate, httpStatusCodes.OK);
    }
  } catch (err: any) {
    LOGGER.error("Error in fetchCorporatesById => ", err);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, err.message);
  }
};

const deleteCorporatesByMultiId: IController = async (req, res) => {
  LOGGER.info("Entered into deleteCorporatesByMultiId");

  try {
    if (req.body.id) {
      const ids = req.body.id;
      LOGGER.info(`Deleting corporates with IDs: ${JSON.stringify(ids)}`);

      const result: any = await CorporateService.deleteCorporatesByMultiId(ids);

      if (result instanceof Error) {
        LOGGER.error(`Error from CorporateService: ${result.message}`);
        return apiResponse.error(
          res,
          httpStatusCodes.BAD_REQUEST,
          result.message
        );
      } else {
        LOGGER.info(`Successfully deleted corporates with IDs: ${JSON.stringify(ids)}`);
        return apiResponse.result(res, result, httpStatusCodes.OK);
      }
    } else {
      LOGGER.error("Missing IDs in request body");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "ID is Required.");
    }
  } catch (error: any) {
    LOGGER.error("Error in deleteCorporatesByMultiId => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const updateCorporate: IController = async (req, res) => {
  LOGGER.info("Entered into updateCorporate");

  let corporate: any;
  try {
    LOGGER.info(`Updating corporate with details: ${JSON.stringify(req.body)}`);

    corporate = await CorporateService.updateCorporate(req);

    if (corporate instanceof Error) {
      LOGGER.error(`Error from CorporateService: ${corporate.message}`);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        corporate.message
      );
    } else {
      LOGGER.info("Successfully updated corporate");
      return apiResponse.result(res, corporate, httpStatusCodes.CREATED);
    }
  } catch (e: any) {
    LOGGER.error("Error in updateCorporate => ", e);

    // @ts-ignore
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry detected");
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        "Duplicate entry not allowed."
      );
    }

    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
  }
};

export default {
  addCorporate,
  getCorporates,
  deleteCorporatesById,
  fetchCorporatesById,
  deleteCorporatesByMultiId,
  updateCorporate,
};
