import offerService from "../Services/Offer.service";
import IController from "../Types/IController";
import ApiResponse from "../utilities/ApiResponse";
import httpStatusCodes from "http-status-codes";
import { uploadFileUsingMulter } from "../utilities/S3Bucket";
import moment from "moment";
import config from "../config";
import common from "../Constants/common";
import WolooGuestService from "../Services/WolooGuest.service";
import LOGGER from "../config/LOGGER";

let { OK, BAD_REQUEST } = httpStatusCodes;

const create: IController = async (req: any, res) => {
  LOGGER.info("Entered into create offer");

  try {
    if (req.file) {
      const imageName = `${moment().unix()}_${req.file.originalname}`;
      const imagePath = `Images/offers/${imageName}`;
      LOGGER.info(`Uploading file with name: ${imagePath}`);

      req.body.image = await uploadFileUsingMulter(req.file, imagePath);
      LOGGER.info(`File uploaded successfully: ${req.body.image}`);
    }

    LOGGER.info(`Creating offer with data: ${JSON.stringify(req.body)}`);
    const result = await offerService.create(req.body);

    if (!result.insertId) {
      LOGGER.error("Error occurred while creating the offer: Insert ID not found");
      throw new Error("Error occurred while creating offer!");
    }

    LOGGER.info("Offer created successfully");
    return ApiResponse.result(res, { message: "Offer created!" }, OK);
  } catch (error: any) {
    LOGGER.error("Error in create offer => ", error);
    return ApiResponse.error(res, BAD_REQUEST, error.message || error);
  }
};

const deleteOffer: IController = async (req, res) => {
  LOGGER.info("Entered into delete offer");

  try {
    LOGGER.info(`Deleting offer with request data: ${JSON.stringify(req.body)}`);
    const result: any = await offerService.deleteOffer(req);

    if (!result.affectedRows) {
      LOGGER.error("Offer not found for deletion");
      throw new Error("Offer not found!");
    }

    LOGGER.info("Offer deleted successfully");
    return ApiResponse.result(res, { message: "Offer deleted!" }, OK);
  } catch (error: any) {
    LOGGER.error("Error in delete offer => ", error);
    return ApiResponse.error(res, BAD_REQUEST, error.message || error);
  }
};

const getOfferById: IController = async (req, res) => {
  LOGGER.info("Entered into getOfferById");

  try {
    if (!req.query.id) {
      LOGGER.error("Offer ID is missing in the request query");
      throw new Error("Offer ID is required!");
    }

    LOGGER.info(`Fetching offer with ID: ${req.query.id}`);
    const result = await offerService.getOfferByID(req.query.id);

    if (!result.length) {
      LOGGER.error(`No offer found with ID: ${req.query.id}`);
      throw new Error("Offer not found!");
    }

    result[0].base_url = config.s3imagebaseurl;
    LOGGER.info(`Offer retrieved successfully: ${JSON.stringify(result[0])}`);
    return ApiResponse.result(res, result, OK);
  } catch (error: any) {
    LOGGER.error("Error in getOfferById => ", error);
    return ApiResponse.error(res, BAD_REQUEST, error.message || error);
  }
};

const getAllOffer: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into getAllOffer");

  try {
    let query = " ";
    const { id: user_id, role_id } = req.session;
    LOGGER.info(`User ID: ${user_id}, Role ID: ${role_id}`);

    const allowedRoles = common.rbac.role_id.host_id === role_id;
    const host = await WolooGuestService.getUserDetailByUser_id(user_id);
    LOGGER.info(`Host details: ${JSON.stringify(host)}`);

    query = allowedRoles
      ? `WHERE woloo_id=${host[0].woloo_id} `
      : `WHERE true `;

    if (req.body.query && req.body.query !== "") {
      query += `AND (title LIKE '%${req.body.query}%')`;
    }

    LOGGER.info(`Executing query: ${query}`);
    const result = await offerService.getAllOffer(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query
    );
    const count = await offerService.getAllOfferCount(query);

    if (result instanceof Error) {
      LOGGER.error(`Error fetching offers: ${result.message}`);
      return ApiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info(`Offers retrieved successfully. Total: ${count}`);
    return ApiResponse.result(res, { data: result, total: count }, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in getAllOffer => ", error);
    return ApiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || error);
  }
};

const updateOffer: IController = async (req, res) => {
  LOGGER.info("Entered into updateOffer");

  try {
    if (!req.body.id) {
      LOGGER.error("Offer ID is missing in the request body");
      throw new Error("ID is required!");
    }

    const id = req.body.id;
    delete req.body.id;
    LOGGER.info(`Updating offer with ID: ${id}`);

    const isOfferExist = await offerService.getOfferByID(id);

    if (!isOfferExist.length) {
      LOGGER.error(`Offer not found with ID: ${id}`);
      throw new Error("Offer not found!");
    }

    if (req.file) {
      const imageName = `${moment().unix()}_${req.file.originalname}`;
      const imagePath = `Images/offers/${imageName}`;
      LOGGER.info(`Uploading file with name: ${imagePath}`);

      req.body.image = await uploadFileUsingMulter(req.file, imagePath);
      LOGGER.info(`File uploaded successfully: ${req.body.image}`);
    }

    LOGGER.info(`Updating offer with data: ${JSON.stringify(req.body)}`);
    const result = await offerService.updateOffer(req.body, id);

    if (!result.affectedRows) {
      LOGGER.error("Error occurred while updating the offer: No rows affected");
      throw new Error("Error occurred while updating offer!");
    }

    LOGGER.info("Offer updated successfully");
    return ApiResponse.result(res, { message: "Offer updated!" }, OK);
  } catch (error: any) {
    LOGGER.error("Error in updateOffer => ", error);
    return ApiResponse.error(res, BAD_REQUEST, error.message || error);
  }
};

export default {
  create,
  deleteOffer,
  updateOffer,
  getOfferById,
  getAllOffer
};
