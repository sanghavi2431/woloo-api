import IController from "../Types/IController";
import SubscriptionService from "../Services/Subscription.service";
import WolooGuestService from "../Services/WolooGuest.service";
import apiResponse from "../utilities/ApiResponse";
import httpStatusCodes from "http-status-codes";
import LOGGER from "../config/LOGGER";
import { WolooGuestModel } from "./../Models/WolooGuest.model";
import { SubscriptionModel } from "../Models/Subscription.model";
import moment from "moment";

import constants from "../Constants";

const fetchAllSubscription: IController = async (req: any, res: any) => {
  LOGGER.info("Entered into fetchAllSubscription");

  try {
    LOGGER.info("Fetching subscription details for user session ID: ", req.session.id);

    const role_id = [9];
    const subscriptions = await WolooGuestService.getUserDetailBySponser_id(req.session.id);
    const subscriptionIds = subscriptions.map((sub: any) => sub.subscription_id);

    LOGGER.info("Fetched subscription IDs: ", subscriptionIds);

    let query = "";
    if (req.body.query && req.body.query.trim() !== "") {
      query = ` WHERE (name LIKE '%${req.body.query}%' OR description LIKE '%${req.body.query}%') `;
      LOGGER.info("Applied query filter: ", query);
    }

    const result = await SubscriptionService.fetchAllSubscription(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query
    );
    const count = await SubscriptionService.fetchAllSubscriptionCount(query);

    LOGGER.info("Successfully fetched subscriptions");

    if (result instanceof Error) {
      LOGGER.error("Error while fetching subscriptions: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    return apiResponse.result(
      res,
      { data: result, total: count },
      httpStatusCodes.OK
    );
  } catch (error: any) {
    LOGGER.error("Unexpected error in fetchAllSubscription: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "Error occurred while fetching subscriptions.");
  }
};

const fetchSubscriptionById: IController = async (req, res) => {
  LOGGER.info("Entered into fetchSubscriptionById");

  if (!req.query.id) {
    LOGGER.error("Missing subscription ID in fetchSubscriptionById");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Subscription ID is required.");
  }

  try {
    LOGGER.info("Fetching subscription by ID: ", req.query.id);

    const subscription = await SubscriptionService.fetchSubscriptionById(req.query.id);

    if (subscription instanceof Error) {
      LOGGER.error("Error while fetching subscription: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    LOGGER.info("Successfully fetched subscription by ID: ", req.query.id);
    return apiResponse.result(res, subscription, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in fetchSubscriptionById: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "Error occurred while fetching subscription.");
  }
};

const isInsurance: IController = async (req, res) => {
  LOGGER.info("Entered into isInsurance");

  if (!req.query.id) {
    LOGGER.error("Missing subscription ID in isInsurance");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Subscription ID is required.");
  }

  try {
    LOGGER.info("Checking insurance status for subscription ID: ", req.query.id);

    const isInsurance = await SubscriptionService.isInsurance(req.query.id);

    if (isInsurance instanceof Error) {
      LOGGER.error("Error while checking insurance status: ", isInsurance.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, isInsurance.message);
    }

    LOGGER.info("Successfully fetched insurance status for subscription ID: ", req.query.id);
    return apiResponse.result(res, isInsurance, httpStatusCodes.OK);
  } catch (err: any) {
    LOGGER.error("Unexpected error in isInsurance: ", err);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, err.message || "Error occurred while checking insurance status.");
  }
};

const deleteSubscription: IController = async (req, res) => {
  LOGGER.info("Entered into deleteSubscription");

  if (!req.query.id) {
    LOGGER.error("Missing subscription ID in deleteSubscription");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Subscription ID is required.");
  }

  try {
    LOGGER.info("Deleting subscription with ID: ", req.query.id);

    const subscription = await SubscriptionService.deleteSubscription(req.query.id);

    if (subscription instanceof Error) {
      LOGGER.error("Error while deleting subscription: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    LOGGER.info("Successfully deleted subscription with ID: ", req.query.id);
    return apiResponse.result(res, subscription, httpStatusCodes.OK);
  } catch (err: any) {
    LOGGER.error("Unexpected error in deleteSubscription: ", err);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, err.message || "Error occurred while deleting subscription.");
  }
};

const createSubscription: IController = async (req, res) => {
  LOGGER.info("Entered into createSubscription");

  try {
    LOGGER.info("Creating subscription with data: ", req.body);

    const subscription = await SubscriptionService.createSubscription(req);

    if (subscription instanceof Error) {
      LOGGER.error("Error while creating subscription: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    LOGGER.info("Successfully created subscription");
    return apiResponse.result(res, subscription, httpStatusCodes.CREATED);
  } catch (e: any) {
    LOGGER.error("Unexpected error in createSubscription: ", e);

    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry error while creating subscription");
      return apiResponse.error(res, httpStatusCodes.CONFLICT, "Duplicate entry. Subscription already exists.");
    }

    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, e.message || "Error occurred while creating subscription.");
  }
};

const bulkDeleteSubscription: IController = async (req, res) => {
  LOGGER.info("Entered into bulkDeleteSubscription");

  if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
    LOGGER.error("Missing or invalid ID array in bulkDeleteSubscription");
    return apiResponse.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      "A valid array of IDs is required."
    );
  }

  try {
    LOGGER.info("Deleting subscriptions with IDs: ", req.body.id);

    const result: any = await SubscriptionService.bulkDeleteSubscription(req.body.id);

    if (result instanceof Error) {
      LOGGER.error("Error during bulkDeleteSubscription: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Successfully deleted subscriptions");
    return apiResponse.result(res, result, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in bulkDeleteSubscription: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "Error occurred while deleting subscriptions.");
  }
};

const updateSubscription: IController = async (req, res) => {
  LOGGER.info("Entered into updateSubscription");

  if (!req.body.id) {
    LOGGER.error("Missing subscription ID in updateSubscription");
    return apiResponse.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      "Subscription ID is required."
    );
  }

  try {
    LOGGER.info("Updating subscription with ID: ", req.body.id);

    const subscription: any = await SubscriptionService.updateSubscription(req);

    if (subscription instanceof Error) {
      LOGGER.error("Error during updateSubscription: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    if (subscription.affectedRows === 0) {
      LOGGER.error("No rows affected during updateSubscription. Likely invalid ID.");
      return apiResponse.error(res, httpStatusCodes.NOT_FOUND, "Subscription not found.");
    }

    LOGGER.info("Successfully updated subscription with ID: ", req.body.id);
    return apiResponse.result(res, subscription, httpStatusCodes.OK);
  } catch (e: any) {
    LOGGER.error("Unexpected error in updateSubscription: ", e);

    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry error during updateSubscription");
      return apiResponse.error(
        res,
        httpStatusCodes.CONFLICT,
        "Duplicate entry. Subscription already exists."
      );
    }

    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, e.message || "Error occurred while updating subscription.");
  }
};

const initSubscription: IController = async (req, res) => {
  LOGGER.info("Entered into initSubscription");

  if (!req.body || Object.keys(req.body).length === 0) {
    LOGGER.error("Request body is missing or empty in initSubscription");
    return apiResponse.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      "Request body is required."
    );
  }

  try {
    LOGGER.info("Initializing subscription with data: ", req.body);

    const subscription: any = await SubscriptionService.initSubscription(req);

    if (subscription instanceof Error) {
      LOGGER.error("Error during initSubscription: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    if (subscription.affectedRows === 0) {
      LOGGER.error("No rows affected during initSubscription.");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Initialization failed.");
    }

    LOGGER.info("Subscription initialized successfully");
    return apiResponse.result(res, subscription, httpStatusCodes.CREATED);
  } catch (e: any) {
    LOGGER.error("Unexpected error in initSubscription: ", e);

    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry error during initSubscription");
      return apiResponse.error(res, httpStatusCodes.CONFLICT, "Subscription already exists.");
    }

    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, e.message || "Error occurred while initializing subscription.");
  }
};

const initSubscriptionByOrder: IController = async (req, res) => {
  LOGGER.info("Entered into initSubscriptionByOrder");

  if (!req.body || Object.keys(req.body).length === 0) {
    LOGGER.error("Request body is missing or empty in initSubscriptionByOrder");
    return apiResponse.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      "Request body is required."
    );
  }

  try {
    LOGGER.info("Initializing subscription by order with data: ", req.body);

    const subscription: any = await SubscriptionService.initSubscriptionByOrder(req);

    if (subscription instanceof Error) {
      LOGGER.error("Error during initSubscriptionByOrder: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    if (subscription.affectedRows === 0) {
      LOGGER.error("No rows affected during initSubscriptionByOrder.");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Initialization by order failed.");
    }

    LOGGER.info("Subscription initialized by order successfully");
    return apiResponse.result(res, subscription, httpStatusCodes.CREATED);
  } catch (e: any) {
    LOGGER.error("Unexpected error in initSubscriptionByOrder: ", e);

    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry error during initSubscriptionByOrder");
      return apiResponse.error(res, httpStatusCodes.CONFLICT, "Subscription already exists.");
    }

    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, e.message || "Error occurred while initializing subscription by order.");
  }
};

const fetchSubscriptionPlans: IController = async (req, res) => {
  LOGGER.info("Entered into fetchSubscriptionPlans");

  try {
    LOGGER.info("Fetching subscription plans with data: ", req.body);

    const subscription: any = await SubscriptionService.fetchSubscriptionPlan(req);

    if (subscription instanceof Error) {
      LOGGER.error("Error in fetchSubscriptionPlans: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    LOGGER.info("Fetched subscription plans successfully");
    return apiResponse.result(res, subscription, httpStatusCodes.OK);
  } catch (e: any) {
    LOGGER.error("Unexpected error in fetchSubscriptionPlans: ", e);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, e.message || "Error occurred while fetching subscription plans.");
  }
};

const submitSubscriptionPurchase: IController = async (req, res) => {
  LOGGER.info("Entered into submitSubscriptionPurchase");

  if (!req.body.plan_id || !req.body.payment_id || !req.body.payment_signature || !req.body.order_id) {
    LOGGER.error("Missing required fields in submitSubscriptionPurchase");
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Missing required fields: plan_id, payment_id, payment_signature, and order_id are required.");
  }

  try {
    LOGGER.info("Processing subscription purchase with data: ", req.body);

    // @ts-ignore
    const userId = req.session?.id || null;
    if (!userId) {
      LOGGER.error("User session ID is missing");
      return apiResponse.error(res, httpStatusCodes.UNAUTHORIZED, "User session is invalid or expired.");
    }

    const { plan_id: planId, payment_id: paymentId, payment_signature: paymentSignature, order_id: orderId, future, userGiftPoints } = req.body;

    let subscription: any;

    if (!userGiftPoints) {
      subscription = await SubscriptionService.submitSubscriptionPurchase(userId, planId, paymentId, paymentSignature, orderId, future);
    } else {
      subscription = await SubscriptionService.submitGiftSubscriptionPurchase(userId, planId, future);
    }

    if (subscription instanceof Error) {
      LOGGER.error("Error in submitSubscriptionPurchase: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    if (subscription.affectedRows === 0) {
      LOGGER.error("No rows affected during submitSubscriptionPurchase");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Purchase failed.");
    }

    LOGGER.info("Subscription purchase processed successfully");
    return apiResponse.result(res, subscription, httpStatusCodes.CREATED);
  } catch (e: any) {
    LOGGER.error("Unexpected error in submitSubscriptionPurchase: ", e);

    if (e.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry error during submitSubscriptionPurchase");
      return apiResponse.error(res, httpStatusCodes.CONFLICT, "Subscription already exists.");
    }

    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, e.message || "Error occurred while processing subscription purchase.");
  }
};

const cancelSubscription: IController = async (req, res) => {
  LOGGER.info("Entered into cancelSubscription");

  try {
    const subscription: any = await SubscriptionService.cancelSubscription(req);

    if (subscription instanceof Error) {
      LOGGER.error("Error in cancelSubscription: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    LOGGER.info("Subscription canceled successfully");
    return apiResponse.result(res, subscription, httpStatusCodes.OK);
  } catch (e: any) {
    LOGGER.error("Unexpected error in cancelSubscription: ", e);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, e.message || "Error occurred while canceling subscription.");
  }
};

const userSubscriptionStatus: IController = async (req, res) => {
  LOGGER.info("Entered into userSubscriptionStatus");

  try {
    const subscription: any = await SubscriptionService.userSubscriptionStatus(req);

    if (subscription instanceof Error) {
      LOGGER.error("Error in userSubscriptionStatus: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    LOGGER.info("Fetched user subscription status successfully");
    return apiResponse.result(res, subscription, httpStatusCodes.OK);
  } catch (e: any) {
    LOGGER.error("Unexpected error in userSubscriptionStatus: ", e);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, e.message || "Error occurred while fetching subscription status.");
  }
};

const mySubscription: IController = async (req, res) => {
  LOGGER.info("Entered into mySubscription");

  try {
    const subscription: any = await SubscriptionService.mySubscription(req);

    if (subscription instanceof Error) {
      LOGGER.error("Error in mySubscription: ", subscription.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, subscription.message);
    }

    LOGGER.info("Fetched user subscription details successfully");
    return apiResponse.result(res, subscription, httpStatusCodes.OK);
  } catch (e: any) {
    LOGGER.error("Unexpected error in mySubscription: ", e);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, e.message || "Error occurred while fetching subscription details.");
  }
};

export default {
  createSubscription,
  fetchAllSubscription,
  fetchSubscriptionById,
  deleteSubscription,
  updateSubscription,
  bulkDeleteSubscription,
  isInsurance,
  initSubscriptionByOrder,
  fetchSubscriptionPlans,
  initSubscription,
  submitSubscriptionPurchase,
  cancelSubscription,
  userSubscriptionStatus,
  mySubscription,
};
