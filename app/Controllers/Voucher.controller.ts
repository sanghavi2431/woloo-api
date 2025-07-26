import httpStatusCodes from "http-status-codes";
import IController from "../Types/IController";
import apiResponse from "../utilities/ApiResponse";
import VoucherService from "../Services/Voucher.service";
import LOGGER from "../config/LOGGER";
import common from "../utilities/common";
import formidable from "formidable";
import { readFile } from "../utilities/XLSXUtility";
import path from "path";
import constantCommon from "../Constants/common";

const createVoucher: IController = async (req, res) => {
  LOGGER.info("Entered into createVoucher");

  const form = new formidable.IncomingForm();
  const uploadFolder = path.join('public', 'files');
  LOGGER.debug("Upload folder path: ", uploadFolder);

  //@ts-ignore
  form.uploadDir = uploadFolder;

  form.parse(req, async (err: any, fields: any, files: any) => {
    try {
      if (err) {
        LOGGER.error("Error parsing form data: ", err);
        return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Invalid form data");
      }

      LOGGER.debug("Form fields: ", fields);
      LOGGER.debug("Uploaded files: ", files);

      let data: any = { ...fields };
      let isCreateLinks = true;

      if (files && files.mobileNumbers) {
        isCreateLinks = false;
        const fileName = files.mobileNumbers.newFilename;
        LOGGER.debug("Processing uploaded file: ", fileName);

        const sheetData = await readFile(path.join(uploadFolder, fileName));
        const mobileNumbers = sheetData.map((o: any) => o.mobile_no);
        data.mobileNumbers = [...mobileNumbers];

        LOGGER.info("Extracted mobile numbers from file");
      }

      data.code = common.voucherGenerator(25);
      data.forceApply = fields.forceApply == 1 ? true : false;

      LOGGER.debug("Prepared voucher data: ", data);

      const result: any = await VoucherService.createVoucherService(req, data, isCreateLinks);

      LOGGER.info("Voucher created successfully");
      return apiResponse.result(res, result, httpStatusCodes.CREATED);
    } catch (error: any) {
      LOGGER.error("Error in createVoucher: ", error);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
    }
  });
};

const webhookVoucher: IController = async (req, res) => {
  LOGGER.info("Entered into webhookVoucher");

  try {
    LOGGER.debug("Webhook query parameters: ", req.query);

    const result = await VoucherService.voucherWebhook(req.query);

    LOGGER.info("Voucher webhook processed successfully");

    if (result.sendEmail == 1) {
      LOGGER.info("Preparing response with email notification for corporate: ", result.corporate);
      return res.render("voucherDownload", {
        corporateName: result.corporate,
        downloadLink: "",
        sendEmail: true,
      });
    } else {
      LOGGER.info("Preparing response with download link for corporate: ", result.corporate);
      return res.render("voucherDownload", {
        corporateName: result.corporate,
        downloadLink: result.downloadLink,
        sendEmail: false,
      });
    }
  } catch (error: any) {
    LOGGER.error("Error in webhookVoucher: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "An error occurred while processing the webhook");
  }
};

const voucherApply: IController = async (req, res) => {
  LOGGER.info("Entered into voucherApply");

  try {
    const { voucher, forceApply } = req.body;

    if (!voucher) {
      LOGGER.error("Voucher code is missing in the request body");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Voucher code is required.");
    }

    LOGGER.info("Applying voucher with code: ", voucher);

    const result: any = await VoucherService.voucherApply(
      voucher,
      //@ts-ignore
      req.session.id,
      forceApply
    );

    LOGGER.info("Voucher applied successfully", { voucher, result });
    return apiResponse.result(res, result, httpStatusCodes.CREATED);
  } catch (error: any) {
    LOGGER.error("Error in voucherApply: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error applying voucher.");
  }
};

const verifyVoucher: IController = async (req, res) => {
  LOGGER.info("Entered into verifyVoucher");

  try {
    const { shortCode } = req.body;

    if (!shortCode) {
      LOGGER.error("Short code is missing in the request body");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Short code is required.");
    }

    LOGGER.info("Verifying voucher with short code: ", shortCode);

    const result = await VoucherService.voucherVerify(shortCode);

    LOGGER.info("Voucher verification completed successfully", { shortCode, result });
    return apiResponse.result(res, result, httpStatusCodes.CREATED);
  } catch (error: any) {
    LOGGER.error("Error in verifyVoucher: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error verifying voucher.");
  }
};

const fetchAllVoucherQuery = (req: any): string => {
  LOGGER.info("Generating query for fetchAllVoucher");

  let query = "";
  let fromDate = "";
  let toDate = "";
  let filterQuery = "";

  const { id: user_id, role_id } = req.session;
  const allowedRoles = constantCommon.rbac.role_id.corporate_admin == role_id;
  const filterData = req.body.filterType || [];

  if (allowedRoles) {
    query += `WHERE v.corporate_id = (SELECT corporate_id FROM users WHERE id = ${user_id}) `;
    LOGGER.info("Corporate admin role detected. Query updated.");
  } else {
    query = "WHERE true ";
  }

  if (filterData.length) {
    for (const filter of filterData) {
      if (filter.type === "date") {
        fromDate = filter.value[0];
        toDate = filter.value[1];
        filterQuery = `AND v.${filter.column} BETWEEN "${fromDate}:00:00:00" AND "${toDate}:23:59:59" `;
        query += filterQuery;
        LOGGER.info("Date filter added to query", { filterQuery });
      } else {
        filterQuery = `AND ${filter.column} = "${filter.value}" `;
        query += filterQuery;
        LOGGER.info("Filter added to query", { filterQuery });
      }
    }
  }

  LOGGER.info("Final query generated", { query });
  return query;
};

const fetchAllVoucher: IController = async (req, res) => {
  LOGGER.info("Entered into fetchAllVoucher");

  try {
    const query = fetchAllVoucherQuery(req);
    LOGGER.info("Executing voucher fetch with query", { query });

    const voucher = await VoucherService.fetchAllVoucher(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query,
      true
    );
    const count = await VoucherService.fetchAllVoucherCount(query);

    if (voucher instanceof Error) {
      LOGGER.error("Error fetching vouchers", { message: voucher.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, voucher.message);
    }

    LOGGER.info("Vouchers fetched successfully", { total: count });
    return apiResponse.result(
      res,
      { data: voucher, total: count },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.error("Error in fetchAllVoucher", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error fetching vouchers.");
  }
};

const fetchVoucherById: IController = async (req, res) => {
  LOGGER.info("Fetching voucher by ID", { id: req.query.id });

  try {
    const voucher = await VoucherService.fetchVoucherById(req.query.id);

    if (voucher instanceof Error) {
      LOGGER.error("Error fetching voucher by ID", { id: req.query.id, message: voucher.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, voucher.message);
    }

    LOGGER.info("Voucher fetched successfully", { id: req.query.id });
    return apiResponse.result(res, voucher, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in fetchVoucherById", { id: req.query.id, error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error fetching voucher.");
  }
};

const deleteVoucher: IController = async (req, res) => {
  LOGGER.info("Deleting voucher by ID", { id: req.query.id });

  try {
    const voucher = await VoucherService.deleteVoucher(req.query.id);

    if (voucher instanceof Error) {
      LOGGER.error("Error deleting voucher", { id: req.query.id, message: voucher.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, voucher.message);
    }

    LOGGER.info("Voucher deleted successfully", { id: req.query.id });
    return apiResponse.result(res, voucher, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in deleteVoucher", { id: req.query.id, error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error deleting voucher.");
  }
};

const fetchCorporateForVoucherDetails: IController = async (req, res) => {
  LOGGER.info("Fetching corporate details for voucher", { id: req.query.id });

  try {
    const corporate = await VoucherService.fetchCorporateForVoucherDetails(req.query.id);

    if (corporate instanceof Error) {
      LOGGER.error("Error fetching corporate details for voucher", { id: req.query.id, message: corporate.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, corporate.message);
    }

    LOGGER.info("Corporate details fetched successfully for voucher", { id: req.query.id });
    return apiResponse.result(res, corporate, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in fetchCorporateForVoucherDetails", { id: req.query.id, error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error fetching corporate details.");
  }
};

const fetchSubscriptionForVoucherDetails: IController = async (req, res) => {
  LOGGER.info("Fetching subscription details for voucher");

  try {
    const subscription = await VoucherService.fetchSubscriptionForVoucherDetails();

    if (subscription instanceof Error) {
      LOGGER.error("Error fetching subscription details for voucher", { message: subscription.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    LOGGER.info("Subscription details fetched successfully for voucher");
    return apiResponse.result(res, subscription, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in fetchSubscriptionForVoucherDetails", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error fetching subscription details.");
  }
};

const getPriceByID: IController = async (req, res) => {
  LOGGER.info("Fetching price by ID", { id: req.query.id });

  try {
    const price = await VoucherService.getPriceByID(req.query.id);

    if (price instanceof Error) {
      LOGGER.error("Error fetching price by ID", { id: req.query.id, message: price.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, price.message);
    }

    LOGGER.info("Price fetched successfully by ID", { id: req.query.id });
    return apiResponse.result(res, price, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in getPriceByID", { id: req.query.id, error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error fetching price by ID.");
  }
};

const updateNoOfUses: IController = async (req, res) => {
  const { id, number_of_uses } = req.body;

  LOGGER.info("Updating number of uses for voucher", { id, number_of_uses });

  try {
    const voucher: any = await VoucherService.updateNoOfUses(id, number_of_uses);

    if (voucher instanceof Error) {
      LOGGER.error("Error updating number of uses for voucher", { id, number_of_uses, message: voucher.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, voucher.message);
    }

    LOGGER.info("Number of uses updated successfully for voucher", { id, number_of_uses });
    return apiResponse.result(res, voucher, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in updateNoOfUses", { id, number_of_uses, error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error updating number of uses.");
  }
};

const bulkDeleteVoucher: IController = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    LOGGER.error("ID is missing in the request body");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "ID is Required.");
  }

  LOGGER.info("Starting bulk delete for voucher(s)", { id });

  try {
    const result: any = await VoucherService.bulkDeleteVoucher(id);

    if (result instanceof Error) {
      LOGGER.error("Error during bulk delete voucher operation", { message: result.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Bulk delete successful", { id });
    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in bulkDeleteVoucher", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error during bulk delete.");
  }
};

const deactivateVoucher: IController = async (req, res) => {
  const { voucher_id, user_id } = req.body;

  if (!voucher_id || !user_id) {
    LOGGER.error("Voucher ID or User ID is missing in the request body");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Voucher ID and User ID are required.");
  }

  LOGGER.info("Starting voucher deactivation", { voucher_id, user_id });

  try {
    const deactivateVoucherUser: any = await VoucherService.deactivateVoucherUser(user_id, voucher_id);
    const deactivateVoucher: any = await VoucherService.deactivateVoucher(voucher_id);

    if (deactivateVoucherUser instanceof Error) {
      LOGGER.error("Error during voucher user deactivation", { voucher_id, user_id, message: deactivateVoucherUser.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, deactivateVoucherUser.message);
    }

    if (deactivateVoucher instanceof Error) {
      LOGGER.error("Error during voucher deactivation", { voucher_id, message: deactivateVoucher.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, deactivateVoucher.message);
    }

    LOGGER.info("Voucher deactivated successfully", { voucher_id, user_id });
    return apiResponse.result(res, deactivateVoucherUser, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in deactivateVoucher", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error deactivating voucher.");
  }
};

const getVoucherUser: IController = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    LOGGER.error("Voucher ID is missing in the request query");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Voucher ID is required.");
  }

  LOGGER.info("Fetching voucher user details for voucher ID:", { id });

  try {
    const voucher: any = await VoucherService.getVoucherUser(id);

    if (voucher instanceof Error) {
      LOGGER.error("Error fetching voucher user details", { voucherId: id, message: voucher.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, voucher.message);
    }

    LOGGER.info("Voucher user details fetched successfully", { id });
    return apiResponse.result(res, voucher, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in getVoucherUser", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error fetching voucher user details.");
  }
};

const fetchVoucherUsers: IController = async (req, res) => {
  const { id, pageSize, pageIndex, sort, query } = req.body;

  if (!id) {
    LOGGER.error("Voucher ID is missing in the request body");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Voucher ID is required.");
  }

  let queryString = " ";

  if (query) {
    queryString = ` WHERE ( name like '%${query}%' ) `;
  }

  LOGGER.info("Fetching voucher users with query: ", { id, query, pageSize, pageIndex, sort });

  try {
    const voucherUsers: any = await VoucherService.fetchVoucherUsers(
      id,
      pageSize,
      pageIndex,
      sort,
      queryString
    );

    const count = await VoucherService.fetchVoucherUsersCount(id);

    if (voucherUsers instanceof Error) {
      LOGGER.error("Error fetching voucher users", { voucherId: id, message: voucherUsers.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, voucherUsers.message);
    }

    LOGGER.info("Voucher users fetched successfully", { id });
    return apiResponse.result(res, { data: voucherUsers, total: count }, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Error in fetchVoucherUsers", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error fetching voucher users.");
  }
};

const PoUpload: IController = async (req, res) => {
  let Paidvoucher: any;
  try {
    LOGGER.info("Starting PO upload process");

    Paidvoucher = await VoucherService.PoUpload(req);

    if (Paidvoucher instanceof Error) {
      LOGGER.error("Error in PO upload", { message: Paidvoucher.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, Paidvoucher.message);
    }

    LOGGER.info("PO upload successful", { Paidvoucher });
    return apiResponse.result(res, Paidvoucher, httpStatusCodes.CREATED);
  } catch (e: any) {
    LOGGER.error("Error in PoUpload process", { error: e });

    // @ts-ignore
    // Handling duplicate entry error specifically
    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.warn("Duplicate entry error in PO upload", { error: e });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Duplicate entry found.");
    } else {
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, e.message);
    }
  }
};

const downloadVoucher: IController = async (req, res) => {
  try {
    const { voucherId } = req.body;
    
    if (!voucherId) {
      LOGGER.error("Voucher ID is missing in the request body");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Voucher ID is required.");
    }

    LOGGER.info("Initiating download for voucher ID:", { voucherId });

    const result = await VoucherService.voucherDownload(voucherId);

    if (result instanceof Error) {
      LOGGER.error("Error downloading voucher", { voucherId, message: result.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Voucher download successful", { voucherId });
    return apiResponse.result(res, result, httpStatusCodes.ACCEPTED);
  } catch (error: any) {
    LOGGER.error("Error in downloadVoucher", { error });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error downloading voucher.");
  }
};

const UserGiftPopUp: IController = async (req, res) => {
  try {
    const { id } = req.query;
    // @ts-ignore
    const { id: sessionId } = req.session;
    
    if (!id || !sessionId) {
      LOGGER.error("Missing required parameters in UserGiftPopUp", { id, sessionId });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "ID and session ID are required.");
    }
    
    LOGGER.info("Fetching user gift pop-up details for ID:", { id, sessionId });
    
    // @ts-ignore
    const userGift: any = await VoucherService.UserGiftPopUp(id, sessionId);

    if (userGift instanceof Error) {
      LOGGER.error("Error fetching user gift pop-up", { id, sessionId, message: userGift.message });
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, userGift.message);
    }

    userGift.showPopUp = 1;
    LOGGER.info("User gift pop-up details fetched successfully", { id, sessionId });
    return apiResponse.result(res, userGift, httpStatusCodes.OK);
  } catch (err: any) {
    LOGGER.error("Error in UserGiftPopUp", { err });
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, err.message || "Error fetching user gift pop-up.");
  }
};

export default {
  createVoucher,
  webhookVoucher,
  verifyVoucher,
  voucherApply,
  fetchAllVoucher,
  fetchVoucherById,
  deleteVoucher,
  getVoucherUser,
  fetchCorporateForVoucherDetails,
  fetchSubscriptionForVoucherDetails,
  getPriceByID,
  bulkDeleteVoucher,
  fetchVoucherUsers,
  PoUpload,
  downloadVoucher,
  deactivateVoucher,
  updateNoOfUses,
  UserGiftPopUp,
  fetchAllVoucherQuery
};
