import IController from "../Types/IController";
import WolooGuestService from "../Services/WolooGuest.service";
import apiResponse from "../utilities/ApiResponse";
import { ApiResponseWithMessage } from "../utilities/ApiResponse";
import httpStatusCodes from "http-status-codes";
import LOGGER from "../config/LOGGER";
import constants from "../Constants";
import * as path from "path";
import { writeFileXLSX } from "../utilities/XLSXUtility";
import { uploadLocalFile } from "../utilities/S3Bucket";
import WolooHostService from "../Services/WolooHost.service";
import RazorpayUtils from "../utilities/Razorpay";
import config from "../config";
import common from "../Constants/common";
import VoucherService from "../Services/Voucher.service";
import VoucherController from "./Voucher.controller";
import moment from "moment";
import fs, { PathLike } from 'fs';
import { RedisClient } from "../utilities/redisClient";
import { SettingModel } from "./../Models/Setting.model";

const sendOTP: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into sendOTP");

  try {
    const mobileNumber: number = req.body.mobileNumber;
    const referral_code = req.body.referral_code;
    const woloo_id = req.body.woloo_id;

    if (!mobileNumber) {
      LOGGER.error("Mobile number is missing in the request");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Mobile number is required");
    }

    LOGGER.info("Generating OTP for mobile number: ", { mobileNumber, referral_code, woloo_id });

    const wolooGuest: any = await WolooGuestService.createGuestOTP(
      mobileNumber,
      referral_code,
      woloo_id
    );

    if (wolooGuest instanceof Error) {
      LOGGER.error("Error in sendOTP: ", wolooGuest.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, wolooGuest.message);
    }

    LOGGER.info("OTP generated successfully for mobile number: ", mobileNumber);
    return apiResponse.result(res, wolooGuest, httpStatusCodes.OK);
  } catch (err: any) {
    LOGGER.error("Unexpected error in sendOTP: ", err);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      err.message || "An error occurred while generating OTP"
    );
  }
};
const sendOTPForClient: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into sendOTPForClient");

  try {
    const mobileNumber: number = req.body.mobileNumber;
    if (!mobileNumber) {
      LOGGER.error("Mobile number is missing in the request");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Mobile number is required");
    }

    LOGGER.info("Generating OTP for mobile number: ", { mobileNumber });

    const wolooGuest: any = await WolooGuestService.createOTPForClient(
      mobileNumber,
    );

    if (wolooGuest instanceof Error) {
      LOGGER.error("Error in sendOTP: ", wolooGuest.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, wolooGuest.message);
    }

    LOGGER.info("OTP generated successfully for mobile number: ", mobileNumber);
    return apiResponse.result(res, wolooGuest, httpStatusCodes.OK);
  } catch (err: any) {
    LOGGER.error("Unexpected error in sendOTP: ", err);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      err.message || "An error occurred while generating OTP"
    );
  }
};
const sendOTPForHost: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into sendOTPForHost");

  try {
    const mobileNumber: number = req.body.mobileNumber;

    if (!mobileNumber) {
      LOGGER.error("Mobile number is missing in the request");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Mobile number is required");
    }

    LOGGER.info("Generating OTP for host with mobile number: ", mobileNumber);

    const wolooGuest: any = await WolooGuestService.createOTPForHost(mobileNumber);

    if (wolooGuest instanceof Error) {
      LOGGER.error("Error in sendOTPForHost: ", wolooGuest.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, wolooGuest.message);
    }

    LOGGER.info("OTP for host generated successfully for mobile number: ", mobileNumber);
    return apiResponse.result(res, wolooGuest, httpStatusCodes.OK);
  } catch (err: any) {
    LOGGER.error("Unexpected error in sendOTPForHost: ", err);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      err.message || "An error occurred while generating OTP for host"
    );
  }
};

const updateDeviceToken: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into updateDeviceToken");

  try {
    LOGGER.info("Updating device token for request: ", req.body);

    const updateDeviceToken: any = await WolooGuestService.updateDeviceToken(req);

    if (updateDeviceToken instanceof Error) {
      LOGGER.error("Error in updateDeviceToken: ", updateDeviceToken.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, updateDeviceToken.message);
    }

    LOGGER.info("Device token updated successfully for request: ", req.body);
    return apiResponse.result(res, updateDeviceToken, httpStatusCodes.OK);
  } catch (err: any) {
    LOGGER.error("Unexpected error in updateDeviceToken: ", err);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      err.message || "An error occurred while updating the device token"
    );
  }
};

const verifyOTP: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into verifyOTP");

  try {
    LOGGER.info("Verifying OTP for request: ", req.body);

    const result: any = await WolooGuestService.verifyGuestOTP(req.body);

    if (result instanceof Error) {
      LOGGER.error("Error in verifyOTP: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("OTP verified successfully for mobile number: ", req.body.mobileNumber);
    LOGGER.info("LOGIN SUCCESSFUL");
    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in verifyOTP: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while verifying OTP"
    );
  }
};

const verifyOTPForClient: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into verifyOTP");

  try {
    LOGGER.info("Verifying OTP for request: ", req.body);

    const result: any = await WolooGuestService.verifyOTPForClient(req.body);

    if (result instanceof Error) {
      LOGGER.error("Error in verifyOTP: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("OTP verified successfully for mobile number: ", req.body.mobileNumber);
    LOGGER.info("LOGIN SUCCESSFUL");
    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in verifyOTP: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while verifying OTP"
    );
  }
};

const verifyOTPForHost: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into verifyOTPForHost");

  try {
    LOGGER.info("Verifying OTP for host with request: ", req.body);

    const result: any = await WolooGuestService.verifyHostOTP(req.body);

    if (result instanceof Error) {
      LOGGER.error("Error in verifyOTPForHost: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Host OTP verified successfully for mobile number: ", req.body.mobileNumber);
    LOGGER.info("LOGIN SUCCESSFUL");
    return apiResponse.result(res, result[0], httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in verifyOTPForHost: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while verifying OTP for host"
    );
  }
};
const updateRegisterStatus: IController = async (req: any, res: any) => {
    try {
    
    const userId = req.session.id
    const result: any = await WolooGuestService.updateRegisterStatus(userId);

    if (result instanceof Error) {
      LOGGER.error("Error in updateRegisterStatus: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }
    return apiResponse.result(res, result[0], httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in updateRegisterStatus: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while updateRegisterStatus"
    );
  }
}; 

const fetchAllWolooGuest: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into fetchAllWolooGuest");

  try {
    LOGGER.info("Fetching all Woloo guests with query: ", req.body.query);

    let query = " ";
    if (req.body.query && req.body.query.trim() !== "") {
      query = ` WHERE ( name LIKE '%${req.body.query}%' 
                OR email LIKE '%${req.body.query}%' 
                OR mobile LIKE '%${req.body.query}%' 
                OR city LIKE '%${req.body.query}%' ) `;
    }

    LOGGER.info("Executing fetchAllWolooGuest with query: ", query);

    const result = await WolooGuestService.fetchAllWolooGuest(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query
    );

    const count = await WolooGuestService.fetchWolooGuestCount(query);

    if (result instanceof Error) {
      LOGGER.error("Error in fetchAllWolooGuest: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Successfully fetched Woloo guests");
    return apiResponse.result(
      res,
      { data: result, total: count },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.error("Unexpected error in fetchAllWolooGuest: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while fetching Woloo guests"
    );
  }
};

const fetchWolooGuestById: IController = async (req, res) => {
  LOGGER.info("Entered into fetchWolooGuestById");

  try {
    const guestId = req.query.id;

    if (!guestId) {
      LOGGER.error("Guest ID is missing in the request");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Guest ID is required");
    }

    LOGGER.info("Fetching Woloo guest details for ID: ", guestId);

    const user: any = await WolooGuestService.fetchWolooGuestById(guestId);

    if (user instanceof Error) {
      LOGGER.error("Error in fetchWolooGuestById: ", user.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, user.message);
    }

    LOGGER.info("Successfully fetched Woloo guest details for ID: ", guestId);
    return apiResponse.result(res, user, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in fetchWolooGuestById: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while fetching Woloo guest details"
    );
  }
};

const deleteWolooGuestById: IController = async (req, res) => {
  LOGGER.info("Entered into deleteWolooGuestById");

  try {
    const guestId = req.query.id;

    if (!guestId) {
      LOGGER.error("Guest ID is missing in the request");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Guest ID is required");
    }

    LOGGER.info("Attempting to delete Woloo guest with ID: ", guestId);

    const woloo: any = await WolooGuestService.deleteWolooGuestById(guestId);

    if (woloo instanceof Error) {
      LOGGER.error("Error in deleteWolooGuestById: ", woloo.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, woloo.message);
    }

    LOGGER.info("Successfully deleted Woloo guest with ID: ", guestId);
    return apiResponse.result(res, woloo, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in deleteWolooGuestById: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while deleting Woloo guest"
    );
  }
};

const getAppConfig: IController = async (req: any, res) => {
  LOGGER.info("Entered into getAppConfig");

  try {
    const locale = req.body.locale;

    if (!locale || !locale.packageName || !locale.platform) {
      LOGGER.error("Invalid locale data provided in the request");
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        "Locale packageName and platform are required"
      );
    }

    LOGGER.info("Fetching app configuration for package: ", locale.packageName, " and platform: ", locale.platform);

    const result = await WolooGuestService.appConfigGet(
      locale.packageName,
      locale.platform
    );

    LOGGER.info("App configuration fetched successfully");
    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in getAppConfig: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while fetching app configuration"
    );
  }
};

const deleteWolooGuestByMultiId: IController = async (req, res) => {
  LOGGER.info("Entered into deleteWolooGuestByMultiId");

  try {
    const guestIds = req.body.id;

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      LOGGER.error("Invalid or missing guest IDs in the request");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Valid guest IDs are required");
    }

    LOGGER.info("Attempting to delete Woloo guests with IDs: ", guestIds);

    const result: any = await WolooGuestService.deleteWolooGuestByMultiId(guestIds);

    if (result instanceof Error) {
      LOGGER.error("Error in deleteWolooGuestByMultiId: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Successfully deleted Woloo guests with IDs: ", guestIds);
    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in deleteWolooGuestByMultiId: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while deleting Woloo guests"
    );
  }
};

const createWolooGuest: IController = async (req, res) => {
  LOGGER.info("Entered into createWolooGuest");

  try {
    LOGGER.info("Attempting to create a Woloo guest");

    const wolooUser: any = await WolooGuestService.createWolooGuest(req);

    if (wolooUser instanceof Error) {
      LOGGER.error("Error in createWolooGuest: ", wolooUser.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, wolooUser.message);
    }

    LOGGER.info("Successfully created Woloo guest");
    return apiResponse.result(res, wolooUser, httpStatusCodes.CREATED);
  } catch (error: any) {
    if (error.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.warn("Duplicate entry detected in createWolooGuest");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Duplicate entry");
    }

    LOGGER.error("Unexpected error in createWolooGuest: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while creating a Woloo guest"
    );
  }
};

const updateWolooGuest: IController = async (req, res) => {
  LOGGER.info("Entered into updateWolooGuest");

  try {
    LOGGER.info("Attempting to update Woloo guest");

    const user: any = await WolooGuestService.updateWolooGuest(req);

    if (user instanceof Error) {
      LOGGER.error("Error updating Woloo guest: ", user.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, user.message);
    }

    LOGGER.info("Woloo guest updated successfully");
    return apiResponse.result(
      res,
      {
        userData: user.userData,
        message: user.message,
      },
      httpStatusCodes.CREATED
    );
  } catch (error: any) {
    if (error.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.warn("Duplicate entry detected in updateWolooGuest");
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        "Duplicate entry"
      );
    }

    LOGGER.error("Unexpected error in updateWolooGuest: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while updating the Woloo guest"
    );
  }
};

const login: IController = async (req, res) => {
  LOGGER.info("Entered into login");

  WolooGuestService.login(req.body)
    .then((user: any) => {
      if (user instanceof Error) {
        LOGGER.warn("Invalid login attempt: Incorrect Username or Password");
        return apiResponse.error(
          res,
          httpStatusCodes.BAD_REQUEST,
          "Incorrect Username or Password!"
        );
      }

      LOGGER.info("User logged in successfully");
      return apiResponse.result(res, user[0], httpStatusCodes.OK);
    })
    .catch((error: any) => {
      LOGGER.error("Unexpected error during login: ", error);
      return apiResponse.error(
        res,
        httpStatusCodes.INTERNAL_SERVER_ERROR,
        error.message || "An error occurred during login"
      );
    });
};

const fetchWolooGuestProfile: IController = async (req, res) => {
  LOGGER.info("Entered into fetchWolooGuestProfile");

  try {
    // @ts-ignore
    const id = req.session.id;

    if (!id) {
      LOGGER.error("Session ID is missing in the request");
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        "Session ID is required"
      );
    }

    LOGGER.info("Fetching Woloo guest profile for session ID: ", id);

    const profile: any = await WolooGuestService.fetchWolooGuestProfile(id);

    if (profile instanceof Error) {
      LOGGER.error("Error fetching Woloo guest profile: ", profile.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, profile.message);
    }

    LOGGER.info("Woloo guest profile fetched successfully");
    return apiResponse.result(res, profile, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in fetchWolooGuestProfile: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while fetching the Woloo guest profile"
    );
  }
};

const navigationReward: IController = async (req, res) => {
  LOGGER.info("Entered into navigationReward");

  try {
    const wolooId = req.query.wolooId;
    //@ts-ignore
    const userId = req.session.id;

    if (!wolooId) {
      LOGGER.error("Missing wolooId in request query");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "wolooId is required");
    }

    LOGGER.info(`Fetching navigation reward for wolooId: ${wolooId}, userId: ${userId}`);

    const navigationRewardService = await WolooGuestService.navigationRewardService(wolooId, userId);

    if (navigationRewardService instanceof Error) {
      LOGGER.error("Error in navigationRewardService: ", navigationRewardService.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, navigationRewardService.message);
    }

    LOGGER.info("Navigation reward fetched successfully");
    return apiResponse.result(res, { message: navigationRewardService }, httpStatusCodes.CREATED);
  } catch (error: any) {
    LOGGER.error("Unexpected error in navigationReward: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "An error occurred while fetching navigation reward");
  }
};

const profileStatus: IController = async (req, res) => {
  LOGGER.info("Entered into profileStatus");

  try {
    const userId = Number(req.query.user_id);

    if (!userId) {
      LOGGER.error("Missing or invalid user_id in request query");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Valid user_id is required");
    }

    LOGGER.info(`Fetching profile status for user_id: ${userId}`);

    const profileStatus = await WolooGuestService.profileStatusService(userId);

    if (profileStatus instanceof Error) {
      LOGGER.error("Error in profileStatusService: ", profileStatus.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, profileStatus.message);
    }

    LOGGER.info("Profile status fetched successfully");
    return apiResponse.result(res, profileStatus, httpStatusCodes.CREATED);
  } catch (error: any) {
    LOGGER.error("Unexpected error in profileStatus: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "An error occurred while fetching profile status");
  }
};

const coinHistory: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into coinHistory");

  try {
    const userId = req.session.id;

    if (!userId) {
      LOGGER.error("Missing session ID in request");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Session ID is required");
    }

    const limit = Number(config.listPerPage) || 10;
    const pageIndex = Number(req.query.pageIndex) || 0;

    LOGGER.info(`Fetching coin history for userId: ${userId}, pageIndex: ${pageIndex}`);

    const { getHistory, historyCount } = await WolooGuestService.coinHistory(userId, limit, pageIndex);
    const lastPage = Math.ceil(historyCount / limit);

    if (getHistory instanceof Error) {
      LOGGER.error("Error in coinHistoryService: ", getHistory.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, getHistory.message);
    }

    LOGGER.info("Coin history fetched successfully");
    return apiResponse.result(
      res,
      {
        total_count: historyCount,
        last_page: lastPage,
        history_count: getHistory?.length || 0,
        history: getHistory,
      },
      httpStatusCodes.CREATED
    );
  } catch (error: any) {
    LOGGER.error("Unexpected error in coinHistory: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "An error occurred while fetching coin history");
  }
};

const thirstReminder: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into thirstReminder");

  const userId = req.session?.id;
  const { is_thirst_reminder, thirst_reminder_hours } = req.body;

  if (!userId) {
    LOGGER.error("Missing session ID for thirstReminder");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Session ID is required");
  }

  try {
    LOGGER.info(`Setting thirst reminder for user_id: ${userId}`);

    const data = await WolooGuestService.thirstReminder(userId, is_thirst_reminder, thirst_reminder_hours);

    if (data instanceof Error) {
      LOGGER.error("Error in thirstReminder service: ", data.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, data.message);
    }

    const message = Object.keys(data).length
      ? "Thirst reminder successfully added!"
      : "User ID not found!";
    LOGGER.info(message);

    return ApiResponseWithMessage.result(res, data, httpStatusCodes.CREATED, message);
  } catch (error: any) {
    LOGGER.error("Unexpected error in thirstReminder: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "An error occurred while setting thirst reminder");
  }
};

const periodtracker: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into periodtracker");

  const userId = req.session?.id;

  if (!userId) {
    LOGGER.error("Missing session ID for periodtracker");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Session ID is required");
  }

  try {
    LOGGER.info(`Updating period tracker for user_id: ${userId}`);

    const data = await WolooGuestService.periodtracker(req, userId);

    if (data instanceof Error) {
      LOGGER.error("Error in periodtracker service: ", data.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, data.message);
    }

    const message = Object.keys(data).length
      ? "Period tracker details updated successfully"
      : "No existing period tracker data found for the user";
    LOGGER.info(message);

    return ApiResponseWithMessage.result(res, data, httpStatusCodes.CREATED, message);
  } catch (error: any) {
    LOGGER.error("Unexpected error in periodtracker: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "An error occurred while updating period tracker");
  }
};

const viewperiodtracker: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into viewperiodtracker");

  const userId = req.session?.id;

  if (!userId) {
    LOGGER.error("Missing session ID for viewperiodtracker");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Session ID is required");
  }

  try {
    LOGGER.info(`Fetching period tracker details for user_id: ${userId}`);

    const periodTrackerProfile = await WolooGuestService.PeriodTrackerByID(userId);

    if (periodTrackerProfile instanceof Error) {
      LOGGER.error("Error in PeriodTrackerByID service: ", periodTrackerProfile.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, periodTrackerProfile.message);
    }

    const message = Object.keys(periodTrackerProfile).length
      ? "Period tracker details fetched successfully"
      : "No existing period tracker data found for the user";
    LOGGER.info(message);

    return ApiResponseWithMessage.result(res, periodTrackerProfile, httpStatusCodes.CREATED, message);
  } catch (error: any) {
    LOGGER.error("Unexpected error in viewperiodtracker: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "An error occurred while fetching period tracker details");
  }
};

const fetchAllUserWolooRating: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into fetchAllUserWolooRating");

  try {
    const { id: user_id, role_id } = req.session;

    if (!user_id || !role_id) {
      LOGGER.error("Missing session details in fetchAllUserWolooRating");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Session details are required");
    }

    LOGGER.info(`Session details found for user_id: ${user_id}, role_id: ${role_id}`);

    const allowedRoles = common.rbac.role_id.host_id === role_id;

    const host = allowedRoles
      ? await WolooGuestService.getUserDetailByUser_id(user_id)
      : null;

    if (allowedRoles && !host?.length) {
      LOGGER.error("Host details not found for user_id: ", user_id);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Host details not found");
    }

    const baseQuery = allowedRoles && host?.length
      ? `WHERE uwr.woloo_id=${host[0].woloo_id} `
      : `WHERE true `;

    const searchQuery = req.body.query
      ? `AND (us.name LIKE '%${req.body.query}%' OR w.name LIKE '%${req.body.query}%' 
             OR uwr.review_description LIKE '%${req.body.query}%' OR uwr.rating LIKE '%${req.body.query}%')`
      : "";

    const finalQuery = `${baseQuery}${searchQuery}`;

    LOGGER.info("Final query for fetching Woloo ratings: ", finalQuery);

    const result = await WolooGuestService.fetchAllUserWolooRating(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      finalQuery
    );

    const count = await WolooGuestService.fetchAllUserWolooRatingCount(finalQuery);

    if (result instanceof Error) {
      LOGGER.error("Error in fetchAllUserWolooRating: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Fetched Woloo ratings successfully");

    return apiResponse.result(
      res,
      { data: result, total: count },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.error("Unexpected error in fetchAllUserWolooRating: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while fetching user Woloo ratings"
    );
  }
};

const getUsersReport: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into getUsersReport");

  try {
    const { pageSize, pageIndex, sort } = req.body;

    if (!pageSize || !pageIndex) {
      LOGGER.error("Missing pagination details in getUsersReport");
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        "Page size and page index are required"
      );
    }

    LOGGER.info("Generating query for user reports");

    const query = userReportQuery(req);

    LOGGER.info("Query generated for user report: ", query);

    const [result, count] = await Promise.all([
      WolooGuestService.getUsersReport(pageSize, pageIndex, sort, query, true),
      WolooGuestService.getUsersReportCount(query),
    ]);

    if (result instanceof Error) {
      LOGGER.error("Error in getUsersReport service: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Fetched user reports successfully");

    return apiResponse.result(
      res,
      { data: result, total: count },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.error("Unexpected error in getUsersReport: ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An error occurred while fetching user reports"
    );
  }
};

const giftVoucher: IController = async (req, res) => {
  LOGGER.info("Entered into giftVoucher");

  try {
    let result;
    let query = "";
    let count;
    let filterData = req.body.filterType;
    let fromDate = "";
    let toDate = "";
    let filterQuery = "";

    if (req.body.query !== "") {
      query = `WHERE (code LIKE '%${req.body.query}%') `;
    } else {
      query = `WHERE true `;
    }

    LOGGER.info("Initial query for giftVoucher: ", query);

    if (filterData.length) {
      for (let i = 0; i < filterData.length; i++) {
        if (filterData[i].type === "date") {
          fromDate = filterData[i].value[0];
          toDate = filterData[i].value[1];
          filterQuery = `AND v.${filterData[i].column} BETWEEN "${fromDate}" AND "${toDate}:23:59:59" `;
          query += filterQuery;
        } else if (filterData[i].column === "status") {
          if (filterData[i].value === "1") {
            filterQuery = `AND expiry_date >= CURRENT_DATE() `;
            query += filterQuery;
          } else if (filterData[i].value === "0") {
            filterQuery = `AND expiry_date < CURRENT_DATE() `;
            query += filterQuery;
          }
        } else {
          filterQuery = `AND ${filterData[i].column} = "${filterData[i].value}"`;
          query += filterQuery;
        }
      }
    }

    LOGGER.info("Final query for giftVoucher: ", query);

    result = await WolooGuestService.giftVoucher(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query
    );

    count = await WolooGuestService.giftVoucherCount(query);

    if (result instanceof Error) {
      LOGGER.error("Error in giftVoucher service: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Fetched gift voucher data successfully");

    return apiResponse.result(
      res,
      { data: result, total: count },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.error("Unexpected error in giftVoucher: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

function userSubscriptionQuery(req: any): Object {
  LOGGER.info("Entered into userSubscriptionQuery");

  try {
    let query = "";
    let filterData = req.body.filterType;
    let isVoucherFilter = "";
    let fromDate = "";
    let toDate = "";
    let filterQuery = "";

    if (req.body.query !== "") {
      query = `WHERE (u.name LIKE '%${req.body.query}%' OR u.email LIKE '%${req.body.query}%' OR u.ref_code LIKE '%${req.body.query}%' OR u.mobile LIKE '%${req.body.query}%' ) `;
    } else {
      query = `WHERE true `;
    }

    LOGGER.info("Initial query for userSubscriptionQuery: ", query);

    let flag = true;

    if (filterData.length) {
      for (let i = 0; i < filterData.length; i++) {
        if (filterData[i].type === "date") {
          fromDate = filterData[i].value[0];
          toDate = filterData[i].value[1];
          filterQuery = `AND ( u.${filterData[i].column} BETWEEN "${fromDate}:00:00:00" AND "${toDate}:23:59:59" )`;
          query += filterQuery;
          LOGGER.info(`Date filter applied: ${filterQuery}`);
        } else if (filterData[i].column === "status") {
          if (filterData[i].value === "1") {
            filterQuery = `AND u.expiry_date >= CURRENT_DATE() `;
            query += filterQuery;
            LOGGER.info("Status filter for active users applied.");
          } else if (filterData[i].value === "0") {
            filterQuery = `AND u.expiry_date < CURRENT_DATE() `;
            query += filterQuery;
            LOGGER.info("Status filter for expired users applied.");
          }
        } else if (filterData[i].column === "subscription") {
          if (filterData[i].value === "1" || filterData[i].value === "") {
            isVoucherFilter = "subscription";
            filterQuery = ` AND u.subscription_id IS NOT NULL`;
            query += filterQuery;
            LOGGER.info("Subscription filter applied.");
          } else if (filterData[i].value === "0") {
            flag = false;
            isVoucherFilter = "voucher";
            filterQuery = ` AND  u.voucher_id IS NOT NULL  `;
            query += filterQuery;
            LOGGER.info("Voucher filter applied.");
          }
        } else {
          if (!flag) {
            filterQuery = ` AND vc.${filterData[i].column} = "${filterData[i].value}"`;
            query += filterQuery;
            LOGGER.info(`Filter applied: ${filterQuery}`);
          }
        }
      }
    }

    LOGGER.info("Final query for userSubscriptionQuery: ", query);

    return {
      query: query,
      isVoucherFilter: isVoucherFilter,
    };
  } catch (e: any) {
    LOGGER.error("Error in userSubscriptionQuery: ", e);
    return e.toString();
  }
}

function userReportQuery(req: any): any {
  LOGGER.info("Entered into userReportQuery");

  try {
    let query = "";
    let filterData = req.body.filterType;
    let fromDate = "";
    let toDate = "";
    let filterQuery = "";
    let { id: user_id, role_id } = req.session;
    let allowedRoles = common.rbac.role_id.host_id === role_id;

    if (req.body.query !== "") {
      query = `WHERE (u.name LIKE '%${req.body.query}%' OR u.email LIKE '%${req.body.query}%' OR u.ref_code LIKE '%${req.body.query}%' OR u.mobile LIKE '%${req.body.query}%' ) `;
    } else {
      query = `WHERE true `;
    }

    LOGGER.info("Initial query for userReportQuery: ", query);

    if (allowedRoles) {
      query += ` and u.sponsor_id = ${user_id}`;
      LOGGER.info("Sponsor filter applied: ", user_id);
    }

    if (filterData.length) {
      for (let i = 0; i < filterData.length; i++) {
        if (filterData[i].type === "date") {
          fromDate = filterData[i].value[0];
          toDate = filterData[i].value[1];
          filterQuery = `AND ( u.${filterData[i].column} BETWEEN "${fromDate}:00:00:00" AND "${toDate}:23:59:59" )`;
          query += filterQuery;
          LOGGER.info(`Date filter applied: ${filterQuery}`);
        } else if (filterData[i].column === "status") {
          if (filterData[i].value === "1") {
            filterQuery = `AND u.expiry_date >= CURRENT_DATE() `;
            query += filterQuery;
            LOGGER.info("Status filter for active users applied.");
          } else if (filterData[i].value === "0") {
            filterQuery = `AND u.expiry_date < CURRENT_DATE() `;
            query += filterQuery;
            LOGGER.info("Status filter for expired users applied.");
          }
        } else if (filterData[i].column === "type") {
          if (filterData[i].value === "free") {
            filterQuery = `AND (u.subscription_id IS NULL AND u.voucher_id IS NULL AND u.expiry_date IS NOT NULL)`;
            query += filterQuery;
            LOGGER.info("Free type filter applied.");
          } else if (filterData[i].value === "subscription") {
            filterQuery = `AND (u.subscription_id IS NOT NULL AND u.expiry_date IS NOT NULL)`;
            query += filterQuery;
            LOGGER.info("Subscription type filter applied.");
          } else if (filterData[i].value === "voucher") {
            filterQuery = `AND (u.voucher_id IS NOT NULL AND u.expiry_date IS NOT NULL)`;
            query += filterQuery;
            LOGGER.info("Voucher type filter applied.");
          }
        } else if (filterData[i].value) {
          filterQuery = `AND ${filterData[i].column} = "${filterData[i].value}"`;
          query += filterQuery;
          LOGGER.info(`Filter applied: ${filterQuery}`);
        }
      }
    }

    LOGGER.info("Final query for userReportQuery: ", query);

    return query;
  } catch (e: any) {
    LOGGER.error("Error in userReportQuery: ", e);
    return e.toString();
  }
}

function ownerWiseHistorytQuery(req: any): any {
  LOGGER.info("Entered into ownerWiseHistorytQuery");

  try {
    let query = "";
    let filterData = req.body.filterType;

    if (req.body.query !== "") {
      query = ` AND (u.name LIKE '%${req.body.query}%' OR u.email LIKE '%${req.body.query}%' ) `;
      LOGGER.info("Search query applied: ", query);
    }

    if (filterData.length) {
      for (let i = 0; i < filterData.length; i++) {
        if (filterData[i].value !== "") {
          let filterQuery = `AND u.${filterData[i].column} = "${filterData[i].value}"`;
          query += filterQuery;
          LOGGER.info(`Filter applied: ${filterQuery}`);
        }
      }
    }

    LOGGER.info("Final query for ownerWiseHistorytQuery: ", query);

    return query;
  } catch (e: any) {
    LOGGER.error("Error in ownerWiseHistorytQuery: ", e);
    return e.toString();
  }
}

const userReportSubscription: IController = async (req, res) => {
  LOGGER.info("Entered into userReportSubscription");

  try {
    let result;
    let query;
    let count;

    let isVoucherFilter = "subscription";
    LOGGER.info("Initial isVoucherFilter set to subscription");

    let data: any = userSubscriptionQuery(req);
    LOGGER.info("Generated query and filter from userSubscriptionQuery: ", data.query);

    if (data.isVoucherFilter === "subscription") {
      LOGGER.info("Fetching user report for subscriptions");
      result = await WolooGuestService.userReportSubscription(
        req.body.pageSize,
        req.body.pageIndex,
        req.body.sort,
        data.query,
        true
      );

      count = await WolooGuestService.userReportSubscriptionCount(data.query);
    }

    if (data.isVoucherFilter === "voucher") {
      LOGGER.info("Fetching user report for vouchers");
      result = await WolooGuestService.userReportVoucher(
        req.body.pageSize,
        req.body.pageIndex,
        req.body.sort,
        data.query,
        true
      );

      count = await WolooGuestService.userReportVoucherCount(data.query);
    }

    if (result instanceof Error) {
      LOGGER.error("Error in user report subscription or voucher service: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    } else {
      LOGGER.info("User report data fetched successfully");
      return apiResponse.result(
        res,
        { isVoucherFilter: isVoucherFilter, data: result, total: count },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.error("Unexpected error in userReportSubscription: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "An error occurred while fetching user report");
  }
};

const ownerWiseHistory: IController = async (req, res) => {
  LOGGER.info("Entered into ownerWiseHistory");

  try {
    let result;
    let query = "";
    let count;

    LOGGER.info("Generating query for ownerWiseHistory");
    query = ownerWiseHistorytQuery(req);
    LOGGER.info("Generated query for ownerWiseHistory: ", query);

    result = await WolooGuestService.ownerWiseHistory(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      true,
      query
    );
    LOGGER.info("Fetched result for ownerWiseHistory");

    count = await WolooGuestService.ownerWiseHistoryCount(query);

    if (result instanceof Error) {
      LOGGER.error("Error in ownerWiseHistory service: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    } else {
      LOGGER.info("Successfully fetched ownerWiseHistory data");
      return apiResponse.result(
        res,
        { data: result, total: count },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.error("Unexpected error in ownerWiseHistory: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "An error occurred while fetching owner-wise history");
  }
};

let customerHistoryQuery = (req: any) => {
  LOGGER.info("Entered into customerHistoryQuery");

  let query = "";
  let { id: user_id, role_id } = req.session;
  let allowedRoles = common.rbac.role_id.host_id == role_id;
  let filterData = req.body.filterType;
  let all_users = 0;
  let fromDate = "";
  let toDate = "";

  if (allowedRoles) {
    query += ` where w.user_id = ${user_id}`;
    LOGGER.info(`Applied filter for host with user_id: ${user_id}`);
  }

  if (req.body.query !== "") {
    if (query.length) {
      query = ` and  ( us.name like '%${req.body.query}%' OR us.mobile like '%${req.body.query}%')`;
    } else {
      query = ` where  ( us.name like '%${req.body.query}%' OR us.mobile like '%${req.body.query}%')`;
    }
    all_users = 1;
    LOGGER.info("Search query applied: ", query);
  } else {
    all_users = 0;
  }

  if (filterData.length) {
    for (let i = 0; i < filterData.length; i++) {
      if (filterData[i].type === "date") {
        let filterQuery;
        if (query !== "") {
          fromDate = filterData[i].value[0];
          toDate = filterData[i].value[1];
          filterQuery = ` AND ( w.${filterData[i].column} BETWEEN "${fromDate}:00:00:00" AND "${toDate}:23:59:59" )`;
        } else {
          fromDate = filterData[i].value[0];
          toDate = filterData[i].value[1];
          filterQuery = `where ( w.${filterData[i].column} BETWEEN "${fromDate}:00:00:00" AND "${toDate}:23:59:59" )`;
        }
        query += filterQuery;
        LOGGER.info(`Applied date filter: ${filterQuery}`);
      } else if (filterData[i].column === "pincode") {
        let filterQuery;

        if (query !== "") {
          filterQuery = ` AND us.${filterData[i].column} = "${filterData[i].value}"`;
        } else {
          filterQuery = `where us.${filterData[i].column} = "${filterData[i].value}"`;
        }
        query += filterQuery;
        LOGGER.info(`Applied pincode filter: ${filterQuery}`);
      } else {
        let filterQuery;

        if (query !== "") {
          filterQuery = ` AND w.${filterData[i].column} = "${filterData[i].value}"`;
        } else {
          filterQuery = `where w.${filterData[i].column} = "${filterData[i].value}"`;
        }
        query += filterQuery;
        LOGGER.info(`Applied filter: ${filterQuery}`);
      }
    }
  }

  LOGGER.info("Final query for customerHistoryQuery: ", query);

  return { query: query, all_users: all_users };
};

const customerHistory: IController = async (req: any, res) => {
  LOGGER.info("Entered into customerHistory");

  try {
    let data = customerHistoryQuery(req);
    let query = data.query;
    let count = 0;
    let all_users = data.all_users;
    let { role_id } = req.session;

    LOGGER.info("Generated query for customerHistory: ", query);

    const result = await WolooGuestService.customerHistory(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query,
      all_users,
      true,
      role_id
    );

    LOGGER.info("Fetched customer history data");

    count = await WolooGuestService.customerHistoryCount(query);

    if (result instanceof Error) {
      LOGGER.error("Error in customerHistory service: ", result.message);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully fetched customer history");
      return apiResponse.result(
        res,
        { data: result, total: count },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.error("Unexpected error in customerHistory: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "An error occurred while fetching customer history");
  }
};

const getPointsSource: IController = async (req, res) => {
  LOGGER.info("Entered into getPointsSource");

  try {
    LOGGER.info("Fetching points source with is_gift flag: ", req.query.is_gift);

    const pointsSourceList = await WolooGuestService.getPointsSource(
      req.query.is_gift
    );

    if (pointsSourceList instanceof Error) {
      LOGGER.error("Error in getPointsSource service: ", pointsSourceList.message);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        pointsSourceList.message
      );
    } else {
      LOGGER.info("Successfully fetched points source data");
      return apiResponse.result(
        res,
        { data: pointsSourceList },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.error("Unexpected error in getPointsSource: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "An error occurred while fetching points source");
  }
};

const getUsers: IController = async (req, res) => {
  LOGGER.info("Entered into getUsers");

  try {
    LOGGER.info("Fetching user list");

    const UsersList = await WolooGuestService.getUsers();

    if (UsersList instanceof Error) {
      LOGGER.error("Error in getUsers service: ", UsersList.message);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        UsersList.message
      );
    } else {
      LOGGER.info("Successfully fetched user list");
      return apiResponse.result(res, { data: UsersList }, httpStatusCodes.OK);
    }
  } catch (error: any) {
    LOGGER.error("Unexpected error in getUsers: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "An error occurred while fetching users");
  }
};

const getCorporate: IController = async (req, res) => {
  LOGGER.info("Entered into getCorporate");

  try {
    LOGGER.info("Fetching corporate list");

    const CorporateList = await WolooGuestService.getCorporate();

    if (CorporateList instanceof Error) {
      LOGGER.error("Error in getCorporate service: ", CorporateList.message);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        CorporateList.message
      );
    } else {
      LOGGER.info("Successfully fetched corporate list");
      return apiResponse.result(
        res,
        { data: CorporateList },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.error("Unexpected error in getCorporate: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "An error occurred while fetching corporate data");
  }
};

const myOffers: IController = async (req, res) => {
  LOGGER.info("Entered into myOffers");

  try {
    //@ts-ignore
    let userId = req.session.id;
    LOGGER.info(`Fetching offers for userId: ${userId}`);

    const offers = await WolooGuestService.myOffers(userId);

    if (offers instanceof Error) {
      LOGGER.error("Error fetching offers: ", offers.message);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        offers.message
      );
    } else {
      LOGGER.info("Successfully fetched offers for userId: ", userId);
      return apiResponse.result(res, offers, { message: "" }, httpStatusCodes.OK);
    }
  } catch (error: any) {
    LOGGER.error("Unexpected error in myOffers: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "An error occurred while fetching offers");
  }
};

const redeemOffer: IController = async (req, res) => {
  LOGGER.info("Entered into redeemOffer");

  try {
    //@ts-ignore
    let userId = req.session.id;
    let offerId: any = req.query.offer_id;
    LOGGER.info(`Attempting to redeem offer for userId: ${userId} with offerId: ${offerId}`);

    const redeemResult = await WolooGuestService.redeemOffer(userId, offerId);

    if (redeemResult instanceof Error) {
      LOGGER.error("Error redeeming offer: ", redeemResult.message);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        redeemResult.message
      );
    } else {
      LOGGER.info(`Successfully redeemed offer for userId: ${userId}, offerId: ${offerId}`);
      return apiResponse.result(
        res,
        { message: redeemResult },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.error("Unexpected error in redeemOffer: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "An error occurred while redeeming the offer");
  }
};

const getGiftPlan: IController = async (req, res) => {
  LOGGER.info("Entered into getGiftPlan");

  try {
    const { user_id, offer_id } = req.body;
    LOGGER.info(`Fetching gift plan for user_id: ${user_id} and offer_id: ${offer_id}`);

    const giftPlan = await WolooGuestService.getGiftPlan(user_id, offer_id);

    if (giftPlan instanceof Error) {
      LOGGER.error("Error fetching gift plan: ", giftPlan.message);
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        giftPlan.message
      );
    } else {
      LOGGER.info("Successfully fetched gift plan");
      return apiResponse.result(
        res,
        { message: giftPlan },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.error("Unexpected error in getGiftPlan: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Something went wrong");
  }
};

const sendGiftSubscription: IController = async (req, res) => {
  try {
    LOGGER.info("Initiating sendGiftSubscription process", {
      userId: req.body.user_id,
      mobiles: req.body.mobiles,
    });

    var errMobiles: string[] = [];

    LOGGER.info("Checking existing subscriptions for provided mobiles");

    // Check if mobile has a subscription
    for (const mobile of req.body.mobiles) {
      LOGGER.debug("Fetching guest details for mobile", { mobile });
      var sender = await WolooGuestService.fetchWolooGuestByMobileNo(mobile);

      if (sender) {
        LOGGER.debug("Guest found", { sender });
        if (
          (sender.subscription_id || sender.voucher_id || sender.gift_subscription_id) &&
          new Date() < sender.expiry_date
        ) {
          LOGGER.warn("Mobile already has an active subscription", { mobile });
          errMobiles.push(mobile.toString());
        }
      }
    }

    if (errMobiles.length > 0) {
      LOGGER.warn("Some mobiles already have active subscriptions", { errMobiles });
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        `${errMobiles.join(",")} mobile numbers already have existing subscriptions`
      );
    }

    LOGGER.info("Fetching gift subscription ID");
    var giftSubscriptionId = await WolooGuestService.getGiftSubscriptionId();

    LOGGER.debug("Fetching subscription details", { giftSubscriptionId });
    var subscription = await WolooGuestService.findSubscriptionBySubId(giftSubscriptionId);

    if (!subscription) {
      LOGGER.error("Gift subscription not found");
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        "Gift subscription not found"
      );
    }

    if (!req.body.user_id) {
      LOGGER.error("User ID not provided in the request");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "User not found");
    }

    LOGGER.info("Creating Razorpay order");
    var response = await RazorpayUtils.createOrder(
      Math.round(subscription.price_with_gst * req.body.mobiles.length * 100)
    );

    if (response.status === "created" && response.id) {
      LOGGER.info("Razorpay order created successfully", { orderId: response.id });

      for (const mobile of req.body.mobiles) {
        LOGGER.debug("Processing mobile for subscription", { mobile });

        var sender = await WolooGuestService.fetchWolooGuestByMobileNo(mobile);

        if (!sender) {
          LOGGER.info("No existing guest found for mobile, creating new user", { mobile });

          const randomCode = generateRandomCode();
          var freeTrialPeriodDays = await WolooGuestService.getFreeTrialPeriodDays();

          const currentDate = moment();
          const expiryDate = currentDate.add(freeTrialPeriodDays.value, "days").format("YYYY-MM-DD");

          var data = {
            mobile,
            password: "",
            expiry_date: expiryDate,
            ref_code: randomCode,
            is_first_session: 1,
          };

          var user = await WolooGuestService.createUser(data);

          if (user.insertId) {
            LOGGER.info("New user created successfully", { userId: user.insertId });

            var getRegistrationPoint = await new SettingModel().getRegistartionPoint();
            var walletData = {
              user_id: user.insertId,
              transaction_type: "CR",
              remarks: "Registration Point",
              value: getRegistrationPoint[0].value,
              type: "Registration Point",
            };

            await WolooGuestService.createWallet(walletData);
            LOGGER.info("Wallet entry created successfully", { userId: user.insertId });
          }

          var rzpData = {
            user_id: req.body.user_id,
            sender_id: user.id,
            subscription_id: giftSubscriptionId,
            message: req.body.message,
            order_id: response.id,
            coins: subscription.price_with_gst,
            status: 0,
            initial_razopay_response: response,
            created_at: new Date(),
            updated_at: new Date(),
          };

          await WolooGuestService.createRZP(rzpData);
          LOGGER.info("Razorpay entry created for user", { userId: user.id });
        }

        LOGGER.info("Returning order ID", { orderId: response.id });
        return apiResponse.result(res, { order_id: response.id }, httpStatusCodes.OK);
      }
    } else {
      LOGGER.error("Failed to create Razorpay order", { response });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Something went wrong");
    }
  } catch (error: any) {
    LOGGER.error("Error occurred in sendGiftSubscription", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Something went wrong");
  }
};

const generateRandomCode = (length = 10): string => {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const exportXl: IController = async (req: any, res) => {
  try {
    LOGGER.info("Starting exportXl process", { report: req.body.report });

    const report = req.body.report;
    const reportHandlers: Record<string, Function> = {
      subscription: async () => {
        LOGGER.info("Processing subscription report");
        let data: any = userSubscriptionQuery(req);
        let result = await WolooGuestService.userReportSubscription(
          req.body.pageSize,
          req.body.pageIndex,
          req.body.sort,
          data.query,
          false
        );

        if (data.isVoucherFilter === "voucher") {
          LOGGER.info("Applying voucher filter for subscription report");
          result = await WolooGuestService.userReportVoucher(
            req.body.pageSize,
            req.body.pageIndex,
            req.body.sort,
            data.query,
            false
          );
        }

        return result;
      },
      userReport: async () => {
        LOGGER.info("Processing user report");
        const query = userReportQuery(req);
        return WolooGuestService.getUsersReport(
          req.body.pageSize,
          req.body.pageIndex,
          req.body.sort,
          query,
          false
        );
      },
      ownerWiseHistory: async () => {
        LOGGER.info("Processing owner-wise history report");
        const query = ownerWiseHistorytQuery(req);
        return WolooGuestService.ownerWiseHistory(
          req.body.pageSize,
          req.body.pageIndex,
          req.body.sort,
          false,
          query
        );
      },
      ownerHistory: async () => {
        LOGGER.info("Processing owner history report");
        const { id: user_id, role_id } = req.session;
        const allowedRoles = common.rbac.role_id.host_id === role_id;
        const query = allowedRoles ? "" : ` where users.id = ${user_id}`;

        return WolooHostService.ownerHistory(
          req.body.pageIndex,
          req.body.pageSize,
          req.body.sort,
          false,
          query
        );
      },
      customerHistory: async () => {
        LOGGER.info("Processing customer history report");
        const data = customerHistoryQuery(req);
        const { query, all_users } = data;
        const { role_id } = req.session;

        return WolooGuestService.customerHistory(
          req.body.pageSize,
          req.body.pageIndex,
          req.body.sort,
          query,
          all_users,
          false,
          role_id
        );
      },
      voucher: async () => {
        LOGGER.info("Processing voucher report");
        const query = VoucherController.fetchAllVoucherQuery(req);
        const result = await VoucherService.fetchAllVoucher(
          req.body.pageSize,
          req.body.pageIndex,
          req.body.sort,
          query,
          false
        );

        return result.map((value: any) => {
          return {
            ...value,
            type_of_organization: value.type_of_organization.label,
            type_of_voucher: value.type_of_voucher.label,
            lifetime_free: value.lifetime_free.label,
            status: value.status.label,
            payment_mode: value.payment_mode.label,
            is_email: value.is_email.label,
          };
        });
      },
      userVoucherUsage: async () => {
        LOGGER.info("Processing user voucher usage report");
        const data = voucherUserQuery(req);
        return WolooGuestService.getUserVoucherUsage(
          req.body.pageSize,
          req.body.pageIndex,
          req.body.sort,
          data,
          false
        );
      },
    };

    if (!reportHandlers[report]) {
      LOGGER.error("Invalid report type provided", { report });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Invalid report type");
    }

    LOGGER.info("Executing report handler", { report });
    const result = await reportHandlers[report]();

    if (result instanceof Error) {
      LOGGER.error("Error in report generation", { error: result.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Writing data to Excel file");
    const filePath = await writeFileXLSX(result);
    const key = path.parse(filePath ?? "");
    const uploadPath = common.report.UPLOAD_PATH + key.base;

    LOGGER.info("Uploading file to S3", { filePath, uploadPath });
    await uploadLocalFile(
      filePath,
      uploadPath,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Delete the file from the server after uploading
    fs.unlink(filePath as PathLike, (err) => {
      if (err) {
        LOGGER.error("Failed to delete local file", { filePath, error: err });
      } else {
        LOGGER.info("Successfully deleted local file", { filePath });
      }
    });

    LOGGER.info("Excel file generated and uploaded successfully", {
      uploadPath: config.s3imagebaseurl + uploadPath,
    });
    apiResponse.result(
      res,
      {
        Message: "Excel sheet generated",
        uploadPath: config.s3imagebaseurl + uploadPath,
      },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.error("Error in exportXl process", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

function generateHistoryQuery(req: any): string {
  let query = " where users.role_id=9 ";
  const filterData = req.body.filterType;

  if (filterData.length) {
    LOGGER.info("Applying filters to generateHistoryQuery", { filterData });
    for (const filter of filterData) {
      const filterQuery = `AND ${filter.column} = "${filter.value}"`;
      query += filterQuery;
    }
  }

  LOGGER.info("Generated history query", { query });
  return query;
}

function voucherUserQuery(req: any): string {
  try {
    const voucher_code_id = req.body.voucher_code_id;
    let query = `where uvc.voucher_code_id = ${voucher_code_id}`;
    const filterData = req.body.filterType;

    if (filterData.length) {
      LOGGER.info("Applying filters to voucherUserQuery", { filterData });
      for (const filter of filterData) {
        if (filter.type === "date") {
          const fromDate = filter.value[0];
          const toDate = filter.value[1];
          const filterQuery = ` and (uvc.${filter.column} BETWEEN "${fromDate} 00:00:00" AND "${toDate} 23:59:59")`;
          query += filterQuery;
        }
      }
    }

    LOGGER.info("Generated voucher user query", { query });
    return query;
  } catch (error: any) {
    LOGGER.error("Error in voucherUserQuery", { error: error.toString() });
    throw new Error(error.toString());
  }
}

const getUserVoucherUsage: IController = async (req, res) => {
  try {
    LOGGER.info("Starting getUserVoucherUsage process");
    const data = voucherUserQuery(req);

    LOGGER.info("Fetching user voucher usage", {
      pageSize: req.body.pageSize,
      pageIndex: req.body.pageIndex,
      sort: req.body.sort,
    });

    const [result, count] = await Promise.all([
      WolooGuestService.getUserVoucherUsage(
        req.body.pageSize,
        req.body.pageIndex,
        req.body.sort,
        data,
        true
      ),
      WolooGuestService.getUserVoucherUsageTotal(data),
    ]);

    if (result instanceof Error) {
      LOGGER.error("Error fetching user voucher usage", { error: result.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Successfully fetched user voucher usage", {
      dataCount: result.length,
      total: count,
    });

    return apiResponse.result(
      res,
      { data: result, total: count },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.error("Error in getUserVoucherUsage process", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const getReviewOptions: IController = async (req, res) => {
  try {
    LOGGER.info("Fetching review options");
    const result = await WolooGuestService.getReviewOptions();

    if (result instanceof Error) {
      LOGGER.error("Error fetching review options", { error: result.message });
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info("Successfully fetched review options");
    return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "success");
  } catch (error: any) {
    LOGGER.error("Error in getReviewOptions", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const getReviewList: IController = async (req, res) => {
  const pageSize = 20;
  try {
    LOGGER.info("Fetching review list", {
      pageSize,
      pageNumber: req.body.pageNumber,
      woloo_id: req.body.woloo_id,
    });

    let result = await WolooGuestService.getReviewList(
      pageSize,
      req.body.pageNumber,
      req.body.woloo_id
    );

    result = result.map((r: any) => {
      const userDetails = JSON.parse(r.user_details);
      userDetails.avatar = userDetails.avatar || "default.png";
      userDetails.base_url = config.s3imagebaseurl;
      return { ...r, user_details: userDetails };
    });

    const totalReviewCount = await WolooGuestService.getReviewListCount(req.body.woloo_id);

    if (result instanceof Error) {
      LOGGER.error("Error fetching review list", { error: result.message });
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info("Successfully fetched review list", {
      totalReviewCount,
      reviewCount: result.length,
    });

    return ApiResponseWithMessage.result(
      res,
      {
        total_review_count: totalReviewCount,
        review_count: result.length,
        review: result,
      },
      httpStatusCodes.OK,
      "success"
    );
  } catch (error: any) {
    LOGGER.error("Error in getReviewList", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const getPendingReviewStatus: IController = async (req: any, res) => {
  const userId = req.session.id;
  try {
    LOGGER.info("Fetching pending review status", { userId });

    const result = await WolooGuestService.getPendingReviewStatus(userId);

    if (result instanceof Error) {
      LOGGER.error("Error fetching pending review status", { error: result.message });
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info("Successfully fetched pending review status", { result: result[0] });
    return ApiResponseWithMessage.result(res, result[0], httpStatusCodes.OK, "success");
  } catch (error: any) {
    LOGGER.error("Error in getPendingReviewStatus", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const wahcertificate: IController = async (req: any, res) => {
  try {
    const userId = req.session.id;
    const wolooId = req.query.woloo_id;

    LOGGER.info("Fetching WAH certificate", { userId, wolooId });

    const result = await WolooGuestService.wahcertificate(wolooId, userId);

    if (result instanceof Error) {
      LOGGER.error("Error fetching WAH certificate", { error: result.message });
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info("Successfully fetched WAH certificate", { userId, wolooId });
    return ApiResponseWithMessage.result(
      res,
      result,
      httpStatusCodes.OK,
      "Woloo found"
    );
  } catch (error: any) {
    LOGGER.error("Unexpected error in wahcertificate", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const reverseGeocoding: IController = async (req: any, res) => {
  try {
    const { lat, lng } = req.body;

    LOGGER.info("Performing reverse geocoding", { lat, lng });

    const result: any = await WolooGuestService.reverseGeocoding(lat, lng);

    if (result instanceof Error) {
      LOGGER.error("Error in reverse geocoding", { error: result.message });
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info("Reverse geocoding successful", { lat, lng });
    return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "");
  } catch (error: any) {
    LOGGER.error("Unexpected error in reverseGeocoding", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const invite: IController = async (req: any, res) => {
  try {
    LOGGER.info("Processing invite request", { requestBody: req.body });

    const result: any = await WolooGuestService.invite(req);

    if (result instanceof Error) {
      LOGGER.error("Error in invite", { error: result.message });
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info("Invite request successful", { requestBody: req.body });
    return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "");
  } catch (error: any) {
    LOGGER.error("Unexpected error in invite", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const web_invite_page: IController = async (req: any, res) => {
  try {
    LOGGER.info("Fetching data for web invite page", { query: req.query });

    const result: any = await WolooGuestService.web_invite_page(req);

    if (result instanceof Error) {
      LOGGER.error("Error fetching web invite page data", { error: result.message });
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info("Web invite page data fetched successfully");
    res.render("invite", result);
  } catch (error: any) {
    LOGGER.error("Unexpected error in web_invite_page", { error });
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to load the invite page.");
  }
};

const registration: IController = async (req: any, res) => {
  try {
    LOGGER.info("Processing user registration", { requestBody: req.body });

    const result: any = await WolooGuestService.registration(req);

    if (result instanceof Error) {
      LOGGER.error("Error during registration", { error: result.message });
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info("User registered successfully", { result });
    return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "Registration successful.");
  } catch (error: any) {
    LOGGER.error("Unexpected error in registration", { error });
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to process registration.");
  }
};

const scanWoloo: IController = async (req: any, res) => {
  try {
    LOGGER.info("Processing Woloo scan", { requestBody: req.body });

    const result: any = await WolooGuestService.scanWoloo(req);

    if (result instanceof Error) {
      LOGGER.error("Error during Woloo scan", { error: result.message });
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info("Woloo scan completed successfully", { result });
    return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "Scan completed.");
  } catch (error: any) {
    LOGGER.error("Unexpected error in scanWoloo", { error });
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to complete Woloo scan.");
  }
};

const getUserOffer: IController = async (req: any, res) => {
  try {
    const { id: user_id, role_id } = req.session;
    const hostAllowed = common.rbac.role_id.host_id === role_id;
    
    let query = "WHERE Date(uo.expiry_date) >= CURRENT_DATE() ";
    if (req.body.query) {
      query += `AND (us.mobile LIKE '%${req.body.query}%' OR of.title LIKE '%${req.body.query}%' OR uo.expiry_date LIKE '%${req.body.query}%' ) `;
    }
    if (hostAllowed) {
      query += `AND of.woloo_id = (SELECT woloo_id FROM users WHERE id = ${user_id})`;
    }

    LOGGER.info("Fetching user offers", { user_id, query });

    const result = await WolooGuestService.getUserOffer(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query
    );
    const count = await WolooGuestService.getUserOfferCount(query);

    if (result instanceof Error) {
      LOGGER.error("Error fetching user offers", { error: result.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("User offers fetched successfully", { total: count });
    return apiResponse.result(res, { data: result, total: count }, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in getUserOffer", { error });
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch user offers.");
  }
};

const addUserOffer: IController = async (req, res) => {
  try {
    LOGGER.info("Adding user offer", { requestBody: req.body });

    const userOffer = await WolooGuestService.addUserOffer(req.body);
    if (userOffer instanceof Error) {
      LOGGER.error("Error adding user offer", { error: userOffer.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, userOffer.message);
    }

    LOGGER.info("User offer added successfully", { offerData: userOffer });
    return apiResponse.result(res, { data: userOffer }, httpStatusCodes.CREATED);
  } catch (error: any) {
    LOGGER.error("Unexpected error in addUserOffer", { error });
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to add user offer.");
  }
};

const deleteUserOfferById: IController = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      LOGGER.error("Missing offer ID for deletion");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Please provide offer ID.");
    }

    LOGGER.info("Deleting user offer by ID", { offerId: id });
    const result = await WolooGuestService.deleteUserOfferById(Number(id));

    if (result instanceof Error) {
      LOGGER.error("Error deleting user offer", { error: result.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("User offer deleted successfully", { offerId: id });
    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in deleteUserOfferById", { error });
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete user offer.");
  }
};

const fetchUserOfferByID: IController = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      LOGGER.error("Missing offer ID parameter.");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Offer ID is required.");
    }

    LOGGER.info("Fetching user offer by ID", { offerId: id });

    const result: any = await WolooGuestService.fetchUserOfferByID(id);

    if (result instanceof Error) {
      LOGGER.error("Error fetching user offer by ID", { error: result.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("User offer fetched successfully", { offerId: id });
    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in fetchUserOfferByID", { error });
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch user offer by ID.");
  }
};

const updateUserOffer: IController = async (req, res) => {
  try {
    LOGGER.info("Updating user offer", { requestBody: req.body });

    const userOffer: any = await WolooGuestService.updateUserOffer(req.body);

    if (userOffer instanceof Error) {
      LOGGER.error("Error updating user offer", { error: userOffer.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, userOffer.message);
    }

    LOGGER.info("User offer updated successfully", { offerData: userOffer });
    return apiResponse.result(res, userOffer, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in updateUserOffer", { error });
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, "Failed to update user offer.");
  }
};

const getOffer: IController = async (req, res) => {
  try {
    LOGGER.info("Fetching offer");

    const userOffer = await WolooGuestService.getOffer();

    if (userOffer instanceof Error) {
      LOGGER.error("Error fetching offer", { error: userOffer.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, userOffer.message);
    }

    LOGGER.info("Offer fetched successfully");
    return apiResponse.result(res, userOffer, httpStatusCodes.OK);
  } catch (e: any) {
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry error", { error: e.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Duplicate entry detected.");
    }

    LOGGER.error("Unexpected error in getOffer", { error: e });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
  }
};

const getRoles: IController = async (req, res) => {
  try {
    const userOffer = await WolooGuestService.getRoles();

    if (userOffer instanceof Error) {
      LOGGER.error("Error fetching roles", { error: userOffer.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, userOffer.message);
    }

    LOGGER.info("Roles fetched successfully", { rolesCount: userOffer.length });
    return apiResponse.result(res, userOffer, httpStatusCodes.OK);
  } catch (e: any) {
    LOGGER.error("Unexpected error in getRoles", { error: e });
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Duplicate entry error.");
    } else {
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
    }
  }
};

const getUserDetailByUser_id: IController = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      LOGGER.error("Missing user_id parameter.");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "User ID is required.");
    }

    const woloo = await WolooGuestService.getUserDetailByUser_id(user_id);

    if (woloo instanceof Error) {
      LOGGER.error("Error fetching user details", { error: woloo.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, woloo.message);
    }

    LOGGER.info("User details fetched successfully", { userId: user_id });
    return apiResponse.result(res, woloo, httpStatusCodes.OK);
  } catch (e: any) {
    LOGGER.error("Unexpected error in getUserDetailByUser_id", { error: e });
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Duplicate entry error.");
    } else {
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
    }
  }
};

const userLog: IController = async (req, res) => {
  try {
    const userLog: any = await WolooGuestService.userLog(req);
    
    if (userLog instanceof Error) {
      LOGGER.error("Error in userLog service", { error: userLog.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, userLog.message);
    }

    const folderPath = path.join(__dirname, 'public', 'logs');
    const currDate = new Date();
    const fileName = `logs_${currDate.getDate()}_${currDate.getMonth() + 1}_${currDate.getFullYear()}.json`; // Added .json extension
    const filePath = path.join(folderPath, fileName);

    // Ensure the logs directory exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Log the request body to the file
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));  // Pretty-print the JSON

    LOGGER.info("User log saved successfully", { filePath });

    return apiResponse.result(res, userLog, httpStatusCodes.OK);  // Use OK instead of CREATED for fetching logs
  } catch (e: any) {
    LOGGER.error("Unexpected error in userLog", { error: e });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
  }
};

const createClient: IController = async (req: any, res: any) => {
  try {
    const results: any = await WolooGuestService.createClient(req.body);

    if (results instanceof Error) {
      LOGGER.error("Error in createClient service", { error: results.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, results.message);
    } else {
      LOGGER.info("Client created successfully", { data: results });
      return apiResponse.result(res, results, httpStatusCodes.CREATED);
    }
  } catch (e: any) {
    LOGGER.error("Unexpected error in createClient controller", { error: e.message });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
  }
};

const adminCreateClient: IController = async (req: any, res: any) => {
  try {
    const { role_id: role } = req.session;
    const results: any = await WolooGuestService.adminCreateClient(req.body, role);

    if (results instanceof Error) {
      LOGGER.error("Error in adminCreateClient service", { error: results.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, results.message);
    } else {
      LOGGER.info("Admin client creation successful", { data: results });
      return apiResponse.result(res, results, httpStatusCodes.CREATED);
    }
  } catch (e: any) {
    LOGGER.error("Unexpected error in adminCreateClient controller", { error: e.message });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
  }
};

const forgetPassword: IController = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email format (basic check)
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      LOGGER.info("Invalid email format: ", email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Generate the reset token
    const resetToken = await WolooGuestService.generateResetToken(email);

    // Send success message to user
    LOGGER.info(`Password reset requested for email: ${email}`);
    apiResponse.result(res, { message: 'Check your email for the reset link.' }, httpStatusCodes.CREATED);

  } catch (error) {
    LOGGER.error('Error sending reset email for email: ', email, error);
    res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
  }
};

const resetPassword: IController = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      LOGGER.info("Invalid email format: ", email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!oldPassword || !newPassword) {
      LOGGER.info("Missing passwords: oldPassword or newPassword", { email });
      return res.status(400).json({ error: 'Both old and new passwords are required' });
    }

    const getDummyPassword = await RedisClient.getInstance().getEx(email, 300);
    if (!getDummyPassword || getDummyPassword !== oldPassword) {
      LOGGER.error("Invalid old password for email: ", email);
      return res.status(401).json({ error: 'Invalid old password' });
    }

    await WolooGuestService.resetPassword(email, newPassword);
    LOGGER.info(`Password reset successfully for email: ${email}`);

    apiResponse.result(res, { message: 'Password reset successfully' }, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error('Error resetting password for email: ', email, error);
    apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const about: IController = async (req: any, res: any) => {
  try {
    const filePath = path.join(__dirname, "..", "..", "public", "template", "about.html");
    const fileContent = await fs.readFileSync(filePath, "utf-8");

    apiResponse.result(res, {description: fileContent }, httpStatusCodes.OK);
  } catch (e: any) {
    LOGGER.error("Unexpected error in about controller", { error: e.message });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
  }
};

const terms: IController = async (req: any, res: any) => {
  try {
   
    const filePath = path.join(__dirname, "..", "..", "public", "template", "terms.html");
    const fileContent = await fs.readFileSync(filePath, "utf-8");

    apiResponse.result(res, {description: fileContent }, httpStatusCodes.OK);
    return;
  } catch (e: any) {
    LOGGER.error("Unexpected error in adminCreateClient controller", { error: e.message });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
  }
};

export default {
  sendOTP,
  sendOTPForHost,
  verifyOTP,
  createWolooGuest,
  fetchAllWolooGuest,
  fetchWolooGuestById,
  deleteWolooGuestById,
  updateWolooGuest,
  getAppConfig,
  login,
  deleteWolooGuestByMultiId,
  fetchWolooGuestProfile,
  navigationReward,
  profileStatus,
  coinHistory,
  fetchAllUserWolooRating,
  thirstReminder,
  periodtracker,
  viewperiodtracker,
  getUsersReport,
  giftVoucher,
  userReportSubscription,
  ownerWiseHistory,
  exportXl,
  customerHistory,
  getPointsSource,
  getUsers,
  getUserVoucherUsage,
  getCorporate,
  getReviewOptions,
  getReviewList,
  getPendingReviewStatus,
  wahcertificate,
  reverseGeocoding,
  invite,
  web_invite_page,
  registration,
  myOffers,
  redeemOffer,
  getGiftPlan,
  sendGiftSubscription,
  scanWoloo,
  getUserOffer,
  updateUserOffer,
  fetchUserOfferByID,
  deleteUserOfferById,
  addUserOffer,
  getOffer,
  getRoles,
  getUserDetailByUser_id,
  userLog,
  updateDeviceToken,
  createClient,
  adminCreateClient,
  forgetPassword,
  resetPassword,
  verifyOTPForHost,
  about,
  terms,
  updateRegisterStatus,
  sendOTPForClient,
  verifyOTPForClient
};
