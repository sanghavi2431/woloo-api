import httpStatusCodes from "http-status-codes";
import IController from "../Types/IController";
import apiResponse, { ApiResponseWithMessage } from "../utilities/ApiResponse";
import WolooHostService from "../Services/WolooHost.service";
import constants from "../Constants";
import LOGGER from "../config/LOGGER";
import formidable from "formidable";

import bulk_upload from "../utilities/BulkUpload";
import config from "../config";
import { WalletModel } from "../Models/Wallet.model";
import { WolooHostModel } from "../Models/WolooHost.model";
import { UserLocLogs } from "../Models/UserLocationLogs";
import common from "../Constants/common";
import WolooGuestService from "../Services/WolooGuest.service";
import { uploadFile } from "../utilities/S3Bucket";

const createWolooHost: IController = async (req, res) => {
  let woloo: any;
  try {
    woloo = await WolooHostService.createWolooHost(req);

    if (woloo instanceof Error) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
    } else {
      apiResponse.result(res, woloo, httpStatusCodes.CREATED);
    }
  } catch (e: any) {
    // @ts-ignore
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
    } else {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
    }
    return;
  }
};

const addWolooHost: IController = async (req, res) => {
  // console.log("in");
  let WolooHost: any;
  try {
    WolooHost = await WolooHostService.addWolooHost(req);
    if (WolooHost instanceof Error) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
    } else {
      apiResponse.result(res, WolooHost, httpStatusCodes.CREATED);
    }
  } catch (e: any) {
    // @ts-ignore
    apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
    return;
  }
};

const updateWolooHost: IController = async (req, res) => {
  let woloo: any;
  try {
    woloo = await WolooHostService.updateWolooHost(req);

    if (woloo instanceof Error) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, woloo.message);
    } else {
      apiResponse.result(res, woloo, httpStatusCodes.CREATED);
    }
  } catch (e: any) {
    // @ts-ignore
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "ALREADY_EXISTS ");
    } else {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
    }
    return;
  }
};

const fetchWolooHost: IController = async (req: any, res: any) => {
  // try {
  let query = " ";
  let { id: user_id, role_id } = req.session;
  let allowedRoles = common.rbac.role_id.host_id == role_id;

  // Fetch user details
  let host = await WolooGuestService.getUserDetailByUser_id(user_id);

  // Set initial query based on role permissions
  query = allowedRoles ? ` WHERE w.id = ${host[0].woloo_id}` : ` WHERE true`;

  // Check if there's a search query
  if (req.body.query !== "") {
    // Add search conditions to the query
    query += ` AND (w.name LIKE '%${req.body.query}%' OR w.code LIKE '%${req.body.query}%' OR w.title LIKE '%${req.body.query}%' OR w.pincode LIKE '%${req.body.query}%')`;
  }
  // console.log("req.body.pageIndex",req.body.pageIndex,
  // req.body.pageSize,
  // req.body.sort,
  // query)

  let woloo = await WolooHostService.fetchWolooHost(
    req.body.pageIndex,
    req.body.pageSize,
    req.body.sort,
    query
  );

  let count = await WolooHostService.fetchWolooHostCount(query);

  if (woloo instanceof Error) {
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, woloo.message);
  } else {
    return apiResponse.result(
      res,
      { data: woloo, total: count },
      httpStatusCodes.OK
    );
  }
  // } catch (error: any) {
  //   LOGGER.info("Error => ", error);
  //   return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  // }
};

const deleteWolooHostById: IController = async (req, res) => {
  try {
    if (req.query.id) {
      const result: any = await WolooHostService.deleteWolooHostById(
        Number(req.query.id)
      );
      if (result instanceof Error) {
        LOGGER.info("Controller Error : ", result.message);
        apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
      } else {
        LOGGER.info("DELETED SUCCESSFULL");
        apiResponse.result(res, result, httpStatusCodes.OK);
      }
    } else {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Please enter ID");
    }
  } catch (error) {
    LOGGER.info("Controller Error : ", error);
    apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const fetchNearBy: IController = async (req, res) => {
  try {
    const { lat, lng, mode, isSearch, range, is_offer, showAll } = req.body;

    // @ts-ignore
    const session = req.session as { id: number; client_gmaps_key_var?: string };
    const user_id = session.id;
    const gmaps_api_key_var = session?.client_gmaps_key_var;

    // Log user's location query
    await new UserLocLogs().createUserLocationLog({
      user_id,
      des_lat: lat,
      des_lng: lng,
      search_type: "nearby",
    });

    const woloos = await WolooHostService.fetchNearByWoloo(
      lat,
      lng,
      range,
      mode,
      isSearch,
      user_id,
      is_offer,
      showAll,
      gmaps_api_key_var
    );

    if (woloos instanceof Error) {
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, woloos.message);
    }

    return apiResponse.result(res, woloos, httpStatusCodes.OK);
  } catch (err: any) {
    console.error("Error in fetchNearBy:", err);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, err.message || "Something went wrong");
  }
};

const fetchWolooHostById: IController = async (req, res) => {
  try {
    if (req.query.id) {
      const result: any = await WolooHostService.fetchWolooHostById(
        req.query.id
      );

      if (result instanceof Error) {
        LOGGER.info("Controller Error : ", result.message);
        apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
      } else {
        LOGGER.info(" SUCCESSFULLY");
        apiResponse.result(res, result, httpStatusCodes.OK);
      }
    } else {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "ID is Required.");
    }
  } catch (error) {
    LOGGER.info("Controller Error : ", error);
    apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const bulkUploadWoloos: IController = async (req, res) => {
  try {
    const form = new formidable.IncomingForm();
    //@ts-ignore
    // form.uploadDir = "public/files";
    //@ts-ignore
    form.keepExtensions = true;

    form.parse(req, async (err: any, fields: any, files: any) => {
      if (err) {
        apiResponse.error(
          res,
          httpStatusCodes.BAD_REQUEST,
          "Error parsing the form data"
        );
        return;
      }
      const file = files.file;
      const fileName = `Host-Bulk-Upload-Files/${file.originalFilename}`;
      try {
        const s3Url = await uploadFile(file, fileName);
        const serviceResponse = await bulk_upload.bulkUpload(
          1,
          s3Url?.Location
        );
        apiResponse.result(res, serviceResponse, httpStatusCodes.OK);
      } catch (uploadError: any) {
        console.error("Error:", uploadError);
        apiResponse.error(
          res,
          httpStatusCodes.INTERNAL_SERVER_ERROR,
          uploadError.message
        );
      }
    });
  } catch (error: any) {
    console.error("Server Error:", error);
    apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      "Internal server error"
    );
  }
};

const fetchBulkUploadFiles: IController = async (req, res) => {
  try {
    const result = await WolooHostService.fetchBulkUploadFiles();

    if (result instanceof Error) {
      throw new Error("Error fetching bulk upload files");
    } else {
      LOGGER.info("SUCCESSFULLY");
      apiResponse.result(res, result, httpStatusCodes.OK);
    }
  } catch (error: any) {
    LOGGER.info("Controller Error : ", error);
    apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

// Gift Subscription

const addCoins: IController = async (req, res) => {
  try {
    const { coins, mobile, message } = req.body;
    //@ts-ignore
    const userId = req.session.id;
    const result = await WolooHostService.addCoinsService(
      coins,
      mobile,
      message,
      userId
    );
    if (result) apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    console.error(error);
    apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const addCoinsWebhook: IController = async (req, res) => {
  try {
    const paymentId = req.body.payload.payment.entity.id;
    const { order_id, status, future } = req.body.payload.payment.entity;

    const result: any = await WolooHostService.addCoinsWebhookService(
      order_id,
      paymentId,
      status,
      future,
      req.body
    );

    if (result) apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    console.error(error);
    apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};
const getNearByWolooAndOfferCount: IController = async (req, res) => {
  try {
    const result = await WolooHostService.getNearByWolooAndOfferCount(
      req.body.lat,
      req.body.lng,
      req.body.radius
    );
    if (result)
      ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "woloo and offer count"
      );
  } catch (error: any) {
    ApiResponseWithMessage.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      error.message
    );
  }
};

const ownerHistory: IController = async (req: any, res) => {
  try {
    // var query: string = generateHistoryQuery(req);
    let query = "";
    let { id: user_id, role_id } = req.session;
    let allowedRoles = common.rbac.role_id.host_id == role_id;

    if (allowedRoles) {
      query += ` where users.id = ${user_id}`;
    }
    const result = await WolooHostService.ownerHistory(
      req.body.pageIndex,
      req.body.pageSize,
      req.body.sort,
      true,
      query
    );
    // console.log("result", result);

    let count = await WolooHostService.fetchOwnerHistoryCount(
      req.body.sort,
      query
    );
    if (result instanceof Error) {
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      return apiResponse.result(
        res,
        { data: result, total: count },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

function generateHistoryQuery(req: any): string {
  let query = " where users.role_id=9 ";
  let filterData = req.body.filterType;

  if (filterData.length) {
    for (let i = 0; i < filterData.length; i++) {
      let filterQuery = `AND ${filterData[i].column} = "${filterData[i].value}"`;
      query += filterQuery;
    }
  }
  return query;
}

const wolooLike: IController = async (req, res) => {
  try {
    //@ts-ignore
    let user_id = req.session.id;
    let woloo: any = await WolooHostService.wolooLike(
      user_id,
      req.body.woloo_id,
      req.body.like
    );

    if (woloo instanceof Error) {
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, woloo.message);
    } else {
      return apiResponse.result(res, { message: woloo }, httpStatusCodes.OK);
    }
  } catch (error: any) {
    LOGGER.info("Error => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const wolooEngagementCount: IController = async (req, res) => {
  try {
    let woloo: any = await WolooHostService.wolooEngagementCount(
      req.query.woloo_id
    );

    if (woloo instanceof Error) {
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, woloo.message);
    } else {
      return apiResponse.result(res, { message: woloo }, httpStatusCodes.OK);
    }
  } catch (error: any) {
    LOGGER.info("Error => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};
const recommendWoloo: IController = async (req: any, res) => {
  let woloo: any;
  let user_id: any = req.session.id;
  try {
    woloo = await WolooHostService.recommendWoloo(req);
    let recommendWolooPoints = await WolooHostService.getSettingValue();
    if (woloo.affectedRows) {
      await new WalletModel().createWallet({
        user_id: user_id,
        woloo_id: woloo.insertId,
        transaction_type: "CR",
        remarks: "Recommend woloo credits",
        value: recommendWolooPoints,
        type: "Recommend woloo credits",
        is_gift: 0,
      });
    }
    if (woloo instanceof Error) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, woloo.message);
    } else {
      apiResponse.result(
        res,
        { message: "Your request has been submitted successfully" },
        { message: "successful" }
      );
    }
  } catch (e: any) {
    // @ts-ignore
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
    } else {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
    }
    return;
  }
};
const rateToilet: IController = async (req: any, res) => {
  try {
    let woloo: any;
    let user_id: any = req.session.id;
    let { rating, review_description,
      name, address, city, lat, lng, pincode,
    } = req.body

    woloo = await WolooHostService.createWolooWithReportToilet(name, address, city, lat, lng, pincode);

    if (woloo.wolooId) {
      let submitReview: any = await WolooHostService.ReportToilet(
        user_id,
        woloo.wolooId,
        rating,
        review_description,
        '3'
      );
      if (submitReview instanceof Error) {
        return apiResponse.error(
          res,
          httpStatusCodes.BAD_REQUEST,
          submitReview.message
        );
      }
    }
    if (woloo instanceof Error) {
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, woloo.message);
    } else {
      return apiResponse.result(
        res,
        { message: "Your review submitted successfully" },
        { message: "successful" }
      );
    }
  } catch (e: any) {
    // @ts-ignore
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
    } else {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
    }
    return;
  }
};

const userRecommendWoloo: IController = async (req: any, res) => {
  let woloo: any;
  try {
    woloo = await WolooHostService.userRecommendWoloo(req);
    if (woloo instanceof Error) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
    } else {
      ApiResponseWithMessage.result(
        res,
        woloo,
        httpStatusCodes.CREATED,
        "Recommended Woloo"
      );
    }
  } catch (e: any) {
    // @ts-ignore
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
    } else {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
    }
    return;
  }
};

const userCoins: IController = async (req, res) => {
  //@ts-ignore
  let userId = req.session.id;

  try {
    let userCoins: any = await WolooHostService.userCoins(userId);

    if (userCoins instanceof Error) {
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        userCoins.message
      );
    } else {
      return apiResponse.result(res, userCoins, httpStatusCodes.OK);
    }
  } catch (error: any) {
    LOGGER.info("Error => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const submitReview: IController = async (req, res) => {
  try {
    let { woloo_id, rating, review_description, rating_option } = req.body;
    //@ts-ignore
    let user_id = req.session.id;
    if (rating_option.length) {
      rating_option = rating_option.join(",");
    } else {
      rating_option = "3";
    }
    let submitReview: any = await WolooHostService.submitReview(
      user_id,
      woloo_id,
      rating,
      review_description,
      rating_option
    );
    if (submitReview instanceof Error) {
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        submitReview.message
      );
    } else {
      return apiResponse.result(
        res,
        { message: submitReview },
        httpStatusCodes.OK
      );
    }
  } catch (error: any) {
    LOGGER.info("Error => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const wolooRewardHistory: IController = async (req, res) => {
  try {
    //@ts-ignore
    let userId = req.session.id;
    let pageNumber: any = req.query.pageNumber;
    if (pageNumber <= 0) {
      pageNumber = 1;
    }
    let limit: number = Number(config.listPerPage);
    let offset = (pageNumber - 1) * limit;
    let wolooRewardHistory: any = await WolooHostService.wolooRewardHistory(
      userId,
      limit,
      offset
    );
    if (wolooRewardHistory instanceof Error) {
      return apiResponse.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        wolooRewardHistory.message
      );
    } else {
      return apiResponse.result(res, wolooRewardHistory, httpStatusCodes.OK);
    }
  } catch (error: any) {
    LOGGER.info("Error => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const devicePayload: IController = async (req, res) => {
  try {
    const {
      deviceId,
      device_type,
      ppm,
      org_name,
      location_name,
      sub_location,
      ppm_time,
    } = req.body;
    const result = await WolooHostService.updateDevicePayload(
      deviceId,
      device_type,
      ppm,
      org_name,
      location_name,
      sub_location,
      ppm_time
    );
    if (result.affectedRows == 0)
      throw new Error("Failed to insert device payload in the db");
    return apiResponse.result(
      res,
      { message: `Device payload inserted success` },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.info("Error => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const enroute: IController = async (req, res) => {
  try {
    const useragent = req.headers["user-agent"] || "unknown";

    const { overview_polyline, src_lat, src_lng, mode } = req.body;

    // @ts-ignore
    const session = req.session as { id: number; client_gmaps_key_var?: string };
    const user_id = session.id;

    const gmaps_api_key_var = session.client_gmaps_key_var;

    // Increase timeout for long-running service
    req.setTimeout(500000); // 500 seconds

    const result = await WolooHostService.enrouteService(
      overview_polyline,
      user_id,
      src_lat,
      src_lng,
      mode,
      useragent,
      gmaps_api_key_var
    );

    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    console.error("Enroute error:", error);
    LOGGER.error("EnrouteService Exception:", { error: error.message || error });
    return apiResponse.error(
      res,
      httpStatusCodes.INTERNAL_SERVER_ERROR,
      error.message || "An unexpected error occurred."
    );
  }
};

const getLikestatus: IController = async (req, res) => {
  try {
    //@ts-ignore
    const user_id = req.session.id;

    const woloo_id: any = req.query.woloo_id;
    const wolooEngagement = await new WolooHostModel().userWolooEnagement(
      user_id,
      woloo_id
    );
    let is_liked = 0;
    if (
      wolooEngagement[0] &&
      wolooEngagement[0].engagement_type == "like" &&
      wolooEngagement[0].is_active == 1
    ) {
      is_liked = 1;
    } else {
      is_liked = 0;
    }
    return apiResponse.result(res, { is_liked }, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.info("Error => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const getHostDashboardData: IController = async (req, res) => {
  try {
    // @ts-ignore
    const woloo_id = req.query.woloo_id;
    const result = await WolooHostService.getHostDashboardData(Number(woloo_id));
    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error) {
    console.error('Error in getHostDashboardData:', error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
}
const updateHostRole: IController = async (req, res) => {
  try {
    // @ts-ignore
    const { userId } = req.params;

    const updatedUser:any = await WolooHostService.updateUserRoleById(userId);
   
    if (updatedUser instanceof Error) {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, updatedUser.message);
    } else {
      apiResponse.result(res, updatedUser, httpStatusCodes.OK);
    }
  } catch (error) {
    console.error('Error in updateHostRole:', error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Internal server error' });
  }
}
const getWolooFacility: IController = async (req, res) => {
  try {
    if (req.params.userId) {
      const result: any = await WolooHostService.getWolooFacility(
        req.params.userId
      );

      if (result instanceof Error) {
        LOGGER.info("Controller Error : ", result.message);
        apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
      } else {
        LOGGER.info(" SUCCESSFULLY");
        apiResponse.result(res, result, httpStatusCodes.OK);
      }
    } else {
      apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "ID is Required.");
    }
  } catch (error) {
    LOGGER.info("Controller Error : ", error);
    apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

/**
 * Search WolooHosts based on various criteria
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing search parameters
 * @param {string} [req.body.query] - Text search query
 * @param {Object} [req.body.filters] - Search filters
 * @param {Object} [req.body.location] - Location parameters
 * @param {Object} [req.body.sort] - Sorting parameters
 * @param {Object} [req.body.pagination] - Pagination parameters
 * @param {Object} res - Express response object
 * @returns {Object} Response containing search results and pagination info
 * 
 * @example
 * // Example request body
 * {
 *   "query": "clean washroom",
 *   "location": {
 *     "lat": 12.9716,
 *     "lng": 77.5946,
 *     "radius": 5
 *   },
 *   "sort": {
 *     "field": "rating",
 *     "order": "desc"
 *   },
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10
 *   }
 * }
 */
const searchWolooHost: IController = async (req, res) => {
  try {
    const {
      query = '',
      location,
      sort = { field: 'name', order: 'asc' },
      pagination = { page: 1, limit: 10 }
    } = req.body;

    let searchQuery = 'WHERE 1=1';
    const queryParams: any[] = [];

    // Text search
    if (query) {
      searchQuery += ` AND (
        LOWER(w.name) LIKE LOWER(?) OR
        LOWER(w.title) LIKE LOWER(?) OR
        LOWER(w.description) LIKE LOWER(?) OR
        LOWER(w.address) LIKE LOWER(?) OR
        LOWER(w.pincode) LIKE LOWER(?)
      )`;
      queryParams.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }

    // Location-based search using Haversine formula for MySQL
    if (location) {
      const { lat, lng, radius = 10 } = location;
      searchQuery += `
        AND (
          6371 * acos(
            cos(radians(?)) *
            cos(radians(w.lat)) *
            cos(radians(w.lng) - radians(?)) +
            sin(radians(?)) *
            sin(radians(w.lat))
          )
        ) <= ?
      `;
      queryParams.push(lat, lng, lat, radius);
    }

    // Sorting
    const sortField = sort.field || 'name';
    const sortOrder = sort.order || 'asc';
    const sortQuery = ` ORDER BY w.${sortField} ${sortOrder}`;

    // Pagination
    const offset = (pagination.page - 1) * pagination.limit;
    const paginationQuery = ` LIMIT ? OFFSET ?`;
    queryParams.push(pagination.limit, offset);

    const results = await WolooHostService.searchWolooHost(searchQuery, sortQuery, paginationQuery, queryParams);
    const total = await WolooHostService.getSearchCount(searchQuery, queryParams);
    
    return apiResponse.result(
      res,
      {
        data: results,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.error('Search Error:', error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

export default {
  getWolooFacility,
  createWolooHost,
  updateWolooHost,
  fetchWolooHost,
  deleteWolooHostById,
  fetchNearBy,
  fetchWolooHostById,
  bulkUploadWoloos,
  fetchBulkUploadFiles,
  addCoins,
  addCoinsWebhook,
  getNearByWolooAndOfferCount,
  ownerHistory,
  generateHistoryQuery,
  wolooLike,
  wolooEngagementCount,
  recommendWoloo,
  userCoins,
  submitReview,
  wolooRewardHistory,
  userRecommendWoloo,
  devicePayload,
  enroute,
  getLikestatus,
  addWolooHost,
  rateToilet,
  getHostDashboardData,
  updateHostRole,
  searchWolooHost
};
