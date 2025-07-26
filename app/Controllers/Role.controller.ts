import httpStatusCodes from "http-status-codes";
import IController from "../Types/IController";
import apiResponse from "../utilities/ApiResponse";
import RoleService from "../Services/Roles.service";
import constants from "../Constants";
import LOGGER from "../config/LOGGER";
import { ApiResponseWithMessage } from "../utilities/ApiResponse";

const addRole: IController = async (req, res) => {
  LOGGER.info("Entered into addRole");
  try {
    LOGGER.info("Request body: ", req.body);
    const role = await RoleService.addRole(req.body);

    if (role instanceof Error) {
      LOGGER.error("Error while adding role: ", role.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, role.message);
    }

    LOGGER.info("Role added successfully: ", role);
    return apiResponse.result(res, { role }, httpStatusCodes.CREATED);
  } catch (error: any) {
    if (error.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry error: ", error.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Duplicate role entry.");
    }
    LOGGER.error("Unexpected error in addRole: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error occurred while adding role.");
  }
};

const getRole: IController = async (req, res) => {
  LOGGER.info("Entered into getRole");

  try {
    let query = "";
    if (req.body.query && req.body.query !== "") {
      query = ` WHERE ( name LIKE '%${req.body.query}%' OR display_name LIKE '%${req.body.query}%' ) `;
      LOGGER.info("Generated query for roles: ", query);
    }

    const result = await RoleService.getAllRoles(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query
    );
    const count = await RoleService.getAllRoleCount(query);

    if (result instanceof Error) {
      LOGGER.error("Error fetching roles: ", result.message);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    LOGGER.info(`Roles fetched successfully. Total: ${count}`);
    return ApiResponseWithMessage.result(
      res,
      { data: result, total: count },
      httpStatusCodes.OK,
      "Roles fetched successfully."
    );
  } catch (error: any) {
    LOGGER.error("Error in getRole: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error occurred while fetching roles.");
  }
};

const deleteRoleById: IController = async (req, res) => {
  LOGGER.info("Entered into deleteRoleById");

  try {
    if (!req.query.id) {
      LOGGER.error("Role ID is missing in the request query");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Role ID is required.");
    }

    const roleId = Number(req.query.id);
    LOGGER.info(`Deleting role with ID: ${roleId}`);

    const result: any = await RoleService.deleteRoleById(roleId);

    if (result instanceof Error) {
      LOGGER.error("Error while deleting role: ", result.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, result.message);
    }

    LOGGER.info(`Role with ID ${roleId} deleted successfully.`);
    return apiResponse.result(res, { message: "Role deleted successfully." }, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in deleteRoleById: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error occurred while deleting role.");
  }
};

const fetchRoleById: IController = async (req, res) => {
  LOGGER.info("Entered into fetchRoleById");

  try {
    if (!req.query.id) {
      LOGGER.error("Role ID is missing in the request query");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Role ID is required.");
    }

    const roleId = req.query.id;
    LOGGER.info(`Fetching role with ID: ${roleId}`);

    const role = await RoleService.fetchRoleById(roleId);

    if (role instanceof Error) {
      LOGGER.error("Error while fetching role: ", role.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, role.message);
    }

    LOGGER.info(`Role fetched successfully: ${JSON.stringify(role)}`);
    return apiResponse.result(res, role, httpStatusCodes.OK);
  } catch (error: any) {
    LOGGER.error("Unexpected error in fetchRoleById: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error occurred while fetching role.");
  }
};

const updateRole: IController = async (req, res) => {
  LOGGER.info("Entered into updateRole");

  try {
    if (!req.body.id) {
      LOGGER.error("Role ID is missing in the request body");
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Role ID is required.");
    }

    const roleId = req.body.id;
    LOGGER.info(`Updating role with ID: ${roleId}`);
    delete req.body.id; // Remove `id` from the body before passing it to the service

    const updatedRole = await RoleService.updateRole(roleId, { ...req.body });

    if (updatedRole instanceof Error) {
      LOGGER.error("Error while updating role: ", updatedRole.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, updatedRole.message);
    }

    LOGGER.info(`Role updated successfully: ${JSON.stringify(updatedRole)}`);
    return apiResponse.result(res, updatedRole, httpStatusCodes.OK);
  } catch (error: any) {
    if (error.code === constants.ErrorCodes.DUPLICATE_ENTRY) {
      LOGGER.error("Duplicate entry error: ", error.message);
      return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Duplicate entry for role.");
    }

    LOGGER.error("Unexpected error in updateRole: ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message || "Error occurred while updating role.");
  }
};

export default {
  addRole,
  getRole,
  deleteRoleById,
  fetchRoleById,
  updateRole,
};
