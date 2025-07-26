import TransactionService from "../Services/Transaction.service";
import IController from "../Types/IController";
import httpStatusCodes from "http-status-codes";
import apiResponse from "../utilities/ApiResponse";
import LOGGER from "../config/LOGGER";

const getTransactionDetails: IController = async (req, res) => {
  LOGGER.info("Entered into getTransactionDetails");

  try {
    let query = "WHERE true ";
    let filterData = req.body.filterType || [];
    let fromDate = "";
    let toDate = "";

    // Apply search query
    if (req.body.query) {
      query += `AND (tr.transaction_id LIKE '%${req.body.query}%' 
                OR tr.plan_id LIKE '%${req.body.query}%' 
                OR tr.plan_type LIKE '%${req.body.query}%' 
                OR us.name LIKE '%${req.body.query}%' 
                OR us.mobile LIKE '%${req.body.query}%' 
                OR tr.created_at LIKE '%${req.body.query}%' 
                OR tr.transaction_amount LIKE '%${req.body.query}%') `;
    }

    // Apply filters
    filterData.forEach((filter: any) => {
      if (filter.type === "date") {
        fromDate = filter.value[0];
        toDate = filter.value[1];
        query += `AND (tr.${filter.column} BETWEEN "${fromDate}:00:00:00" AND "${toDate}:23:59:59") `;
      } else if (filter.column === "status") {
        if (filter.value === "1") {
          query += `AND (tr.charging_status = "2" AND tr.wallet_txn_id IS NOT NULL) `;
        } else if (filter.value === "0") {
          query += `AND (tr.charging_status IN ("0", "1") OR (tr.charging_status = "2" AND tr.wallet_txn_id IS NULL)) `;
        }
      } else {
        query += `AND ${filter.column} = "${filter.value}" `;
      }
    });

    LOGGER.debug("Generated Query: ", query);

    const [result, count] = await Promise.all([
      TransactionService.getTransactionDetails(
        req.body.pageSize,
        req.body.pageIndex,
        req.body.sort,
        query
      ),
      TransactionService.getAllTransactionDetailsCount(query)
    ]);

    if (result instanceof Error) {
      LOGGER.error("Error in getTransactionDetails: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Transaction details fetched successfully");
    return apiResponse.result(res, { data: result, total: count }, httpStatusCodes.OK);

  } catch (error: any) {
    LOGGER.error("Unexpected error in getTransactionDetails: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "An error occurred while fetching transaction details.");
  }
};

const getTransactionDetailsById: IController = async (req, res) => {
  LOGGER.info("Entered into getTransactionDetailsById");

  try {
    const transactionId = req.query.Id;

    if (!transactionId) {
      LOGGER.error("Transaction ID is missing in the request");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Transaction ID is required");
    }

    const result = await TransactionService.getTransactionDetailsById(transactionId);

    if (result instanceof Error) {
      LOGGER.error("Error in getTransactionDetailsById: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info("Transaction details fetched successfully for ID: ", transactionId);
    return apiResponse.result(res, result, httpStatusCodes.OK);

  } catch (error: any) {
    LOGGER.error("Unexpected error in getTransactionDetailsById: ", error);
    return apiResponse.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message || "An error occurred while fetching transaction details.");
  }
};

export default {
  getTransactionDetails,
  getTransactionDetailsById,
};
