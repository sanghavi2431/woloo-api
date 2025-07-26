import httpStatusCodes from "http-status-codes";
import IController from "../Types/IController";
import apiResponse from "../utilities/ApiResponse";
import SettingService from "../Services/Setting.service";
import constants from "../Constants";
import LOGGER from "../config/LOGGER";

const getSetting: IController = async (req, res) => {
  LOGGER.info("Entered into getSetting");

  try {
    const settings = await SettingService.getSetting();

    if (settings instanceof Error) {
      LOGGER.error("Error while fetching settings: ", settings.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, settings.message);
    }

    LOGGER.info("Settings fetched successfully");
    return apiResponse.result(res, settings, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in getSetting: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "Error occurred while fetching settings.");
  }
};

const addNew: IController = async (req, res) => {
  LOGGER.info("Entered into addNew");

  try {
    const newSetting = await SettingService.addNew(req.body);

    if (newSetting instanceof Error) {
      LOGGER.error("Error while adding new setting: ", newSetting.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, newSetting.message);
    }

    LOGGER.info("New setting added successfully");
    return apiResponse.result(res, newSetting, httpStatusCodes.CREATED);
  } catch (error: any) {
    if (error.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry detected while adding new setting");
      return apiResponse.error(res, httpStatusCodes.CONFLICT, "Duplicate entry for setting.");
    }

    LOGGER.error("Unexpected error in addNew: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "Error occurred while adding new setting.");
  }
};

const updateSetting: IController = async (req, res) => {
  LOGGER.info("Entered into updateSetting");
  try {
    const updatedSetting = await SettingService.updateSetting(req);

    if (updatedSetting instanceof Error) {
      LOGGER.error("Error while updating setting: ", updatedSetting.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, updatedSetting.message);
    }

    LOGGER.info("Setting updated successfully");
    return apiResponse.result(res, updatedSetting, httpStatusCodes.OK);
  } catch (error: any) {
    if (error.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry detected while updating setting");
      return apiResponse.error(res, httpStatusCodes.CONFLICT, "Duplicate entry for setting.");
    }

    LOGGER.error("Unexpected error in updateSetting: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "Error occurred while updating setting.");
  }
};

const deleteSetting: IController = async (req, res) => {
  LOGGER.info("Entered into deleteSetting");

  try {
    if (!req.query.id) {
      LOGGER.error("Missing setting ID in deleteSetting");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Setting ID is required.");
    }

    const deletedSetting = await SettingService.deleteSetting(req.query.id);

    if (deletedSetting instanceof Error) {
      LOGGER.error("Error while deleting setting: ", deletedSetting.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, deletedSetting.message);
    }

    LOGGER.info("Setting deleted successfully");
    return apiResponse.result(res, { message: "Setting deleted successfully" }, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in deleteSetting: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "Error occurred while deleting setting.");
  }
};

export default {
  getSetting,
  addNew,
  updateSetting,
  deleteSetting
};
