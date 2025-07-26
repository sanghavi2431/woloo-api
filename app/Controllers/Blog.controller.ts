import IController from "../Types/IController";
import BlogService from "../Services/Blog.service";
import apiResponse from "../utilities/ApiResponse";
import { ApiResponseWithMessage } from "../utilities/ApiResponse";
import httpStatusCodes from "http-status-codes";
import LOGGER from "../config/LOGGER";
// const path = require('path')

const getBlogsForUserByCategory: IController = async (req: any, res) => {
  LOGGER.info("Entered into getBlogsForUserByCategory");

  const url = req._parsedUrl;
  const fullPath = req.headers.host + url.pathname;
  LOGGER.info(`Request URL: ${fullPath}`);

  let result;
  try {
    LOGGER.info(
      `Fetching blogs for user with session ID: ${req.session.id}, category: ${req.body.category}, page: ${req.body.page}, shop_display: ${req.body.shop_display}`
    );

    result = await BlogService.getBlogsForUserByCategory(
      req.session.id,
      req.body.category,
      url.path,
      req.body.page,
      req.body.shop_display
    );

    LOGGER.info(`BlogService response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully retrieved blogs");
      return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "");
    }
  } catch (error: any) {
    LOGGER.error("Error in getBlogsForUserByCategory => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const getBlogsForShop: IController = async (req: any, res) => {
  LOGGER.info("Entered into getBlogsForShop");

  const url = req._parsedUrl;
  const fullPath = req.headers.host + url.pathname;
  LOGGER.info(`Request URL: ${fullPath}`);

  let result;
  try {
    LOGGER.info(
      `Fetching blogs for shop with session ID: ${req.session.id}, category: ${req.body.category}, page: ${req.body.page}, shop_display: ${req.body.shop_display}`
    );

    result = await BlogService.getBlogsForUserForShop(
      req.session.id,
      req.body.category,
      url.path,
      req.body.page,
      req.body.shop_display
    );

    LOGGER.info(`BlogService response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully retrieved blogs for shop");
      return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "");
    }
  } catch (error: any) {
    LOGGER.error("Error in getBlogsForShop => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const getUserSavedCategories: IController = async (req: any, res) => {
  LOGGER.info("Entered into getUserSavedCategories");

  let result: any;
  try {
    const userId = req.session.id;
    LOGGER.info(`Fetching saved categories for user ID: ${userId}`);

    result = await BlogService.getUserSavedCategories(userId);
    LOGGER.info(`BlogService response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      if (!result.length) {
        LOGGER.info("No saved categories found for the user");
        return ApiResponseWithMessage.result(
          res,
          result,
          httpStatusCodes.OK,
          "No data found"
        );
      }
      LOGGER.info("Successfully retrieved user saved categories");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "user_saved_categories"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getUserSavedCategories => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const getBlogs: IController = async (req: any, res) => {
  LOGGER.info("Entered into getBlogs");

  let result;
  try {
    const query = "where status=1 ";
    LOGGER.info(
      `Fetching blogs with pageSize: ${req.body.pageSize}, pageIndex: ${req.body.pageIndex}, sort: ${req.body.sort}, query: "${query}"`
    );

    result = await BlogService.getBlogs(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query
    );
    LOGGER.info(`BlogService.getBlogs response: ${JSON.stringify(result)}`);

    const count = await BlogService.getBlogsCount(query);
    LOGGER.info(`Total blog count: ${count}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.getBlogs: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully retrieved blogs");
      return ApiResponseWithMessage.result(
        res,
        { data: result, total: count },
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getBlogs => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const getBlogsbyID: IController = async (req: any, res) => {
  LOGGER.info("Entered into getBlogsbyID");

  let result;
  try {
    const blogId = req.body.blog_id;
    LOGGER.info(`Fetching blog details for blog ID: ${blogId}`);

    result = await BlogService.getBlogsbyID(blogId,req.session.id,);
    LOGGER.info(`BlogService.getBlogsbyID response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.getBlogsbyID: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully retrieved blog details by ID");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getBlogsbyID => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const getCategories: IController = async (req: any, res) => {
  LOGGER.info("Entered into getCategories");

  let result;
  try {
    LOGGER.info("Fetching blog categories");

    result = await BlogService.getCategories(req);
    LOGGER.info(`BlogService.getCategories response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.getCategories: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully retrieved blog categories");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getCategories => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const getCategoriesbyId: IController = async (req: any, res) => {
  LOGGER.info("Entered into getCategoriesbyId");

  let result;
  try {
    const categoryId = req.query.id;
    LOGGER.info(`Fetching category details for ID: ${categoryId}`);

    result = await BlogService.getCategoriesbyId(categoryId);
    LOGGER.info(`BlogService.getCategoriesbyId response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.getCategoriesbyId: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully retrieved category details by ID");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getCategoriesbyId => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const getSubCategoriesbyId: IController = async (req: any, res) => {
  LOGGER.info("Entered into getSubCategoriesbyId");

  let result;
  try {
    const subCategoryId = req.query.id;
    LOGGER.info(`Fetching sub-category details for ID: ${subCategoryId}`);

    result = await BlogService.getSubCategoriesbyId(subCategoryId);
    LOGGER.info(`BlogService.getSubCategoriesbyId response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.getSubCategoriesbyId: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully retrieved sub-category details by ID");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getSubCategoriesbyId => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const getBlogs_byId: IController = async (req: any, res) => {
  LOGGER.info("Entered into getBlogs_byId");

  let result;
  try {
    const blogId = req.query.id;
    LOGGER.info(`Fetching blog details for ID: ${blogId}`);

    result = await BlogService.getBlogs_byId(blogId);
    LOGGER.info(`BlogService.getBlogs_byId response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.getBlogs_byId: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully retrieved blog details by ID");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getBlogs_byId => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const insert_blog_category: IController = async (req: any, res) => {
  LOGGER.info("Entered into insert_blog_category");

  let result: any;
  try {
    LOGGER.info(`Inserting blog category with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.insertBlogCategory(req);
    LOGGER.info(`BlogService.insertBlogCategory response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.insertBlogCategory: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully inserted blog category");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in insert_blog_category => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const insert_blog_Subcategory: IController = async (req: any, res) => {
  LOGGER.info("Entered into insert_blog_Subcategory");

  let result: any;
  try {
    LOGGER.info(`Inserting blog subcategory with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.insert_blog_Subcategory(req);
    LOGGER.info(`BlogService.insert_blog_Subcategory response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.insert_blog_Subcategory: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully inserted blog subcategory");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in insert_blog_Subcategory => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const deleteBlogCategorybyId: IController = async (req: any, res) => {
  LOGGER.info("Entered into deleteBlogCategorybyId");

  let result: any;
  try {
    const categoryId = req.query.id;
    LOGGER.info(`Deleting blog category with ID: ${categoryId}`);

    result = await BlogService.deleteBlogCategorybyId(req);
    LOGGER.info(`BlogService.deleteBlogCategorybyId response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.deleteBlogCategorybyId: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info(`Successfully deleted blog category with ID: ${categoryId}`);
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in deleteBlogCategorybyId => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const deleteBlogSubCategorybyId: IController = async (req: any, res) => {
  LOGGER.info("Entered into deleteBlogSubCategorybyId");

  let result: any;
  try {
    const subCategoryId = req.query.id;
    LOGGER.info(`Deleting blog subcategory with ID: ${subCategoryId}`);

    result = await BlogService.deleteBlogSubCategorybyId(req);
    LOGGER.info(`BlogService.deleteBlogSubCategorybyId response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.deleteBlogSubCategorybyId: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info(`Successfully deleted blog subcategory with ID: ${subCategoryId}`);
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in deleteBlogSubCategorybyId => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const deleteBlogbyId: IController = async (req: any, res) => {
  LOGGER.info("Entered into deleteBlogbyId");

  let result: any;
  try {
    const blogId = req.query.id;
    LOGGER.info(`Deleting blog with ID: ${blogId}`);

    result = await BlogService.deleteBlogbyId(req);
    LOGGER.info(`BlogService.deleteBlogbyId response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.deleteBlogbyId: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info(`Successfully deleted blog with ID: ${blogId}`);
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in deleteBlogbyId => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const updateBlogCategory: IController = async (req: any, res) => {
  LOGGER.info("Entered into updateBlogCategory");

  let result: any;
  try {
    LOGGER.info(`Updating blog category with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.updateBlogCategory(req);
    LOGGER.info(`BlogService.updateBlogCategory response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.updateBlogCategory: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully updated blog category");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in updateBlogCategory => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const updateBlogSubCategory: IController = async (req: any, res) => {
  LOGGER.info("Entered into updateBlogSubCategory");

  let result: any;
  try {
    LOGGER.info(`Updating blog subcategory with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.updateBlogSubCategory(req);
    LOGGER.info(`BlogService.updateBlogSubCategory response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.updateBlogSubCategory: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully updated blog subcategory");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in updateBlogSubCategory => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const update_Blog: IController = async (req: any, res) => {
  LOGGER.info("Entered into update_Blog");

  let result: any;
  try {
    LOGGER.info(`Updating blog with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.update_Blog(req);
    LOGGER.info(`BlogService.update_Blog response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.update_Blog: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully updated the blog");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in update_Blog => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const create_Blog: IController = async (req: any, res) => {
  LOGGER.info("Entered into create_Blog");

  let result: any;
  try {
    LOGGER.info(`Creating blog with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.create_Blog(req);
    LOGGER.info(`BlogService.create_Blog response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.create_Blog: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully created the blog");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in create_Blog => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const blogReadPoint: IController = async (req: any, res) => {
  LOGGER.info("Entered into blogReadPoint");

  let result;
  try {
    LOGGER.info(`Fetching read point for blog with ID: ${req.query.blog_id}, User session ID: ${req.session.id}`);

    result = await BlogService.blogReadPoint(req.session.id, req.query.blog_id);
    LOGGER.info(`BlogService.blogReadPoint response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.blogReadPoint: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully fetched blog read point");
      return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "");
    }
  } catch (error: any) {
    LOGGER.error("Error in blogReadPoint => ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      "Something went wrong !"
    );
  }
};

const ctaLikes: IController = async (req: any, res) => {
  LOGGER.info("Entered into ctaLikes");

  let result: any;
  try {
    LOGGER.info(`Processing CTA likes with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.ctaLikes(req);
    LOGGER.info(`BlogService.ctaLikes response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.ctaLikes: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully processed CTA likes");
      return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "");
    }
  } catch (error: any) {
    LOGGER.error("Error in ctaLikes => ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      "Something went wrong !"
    );
  }
};

const ctaFavourite: IController = async (req: any, res) => {
  LOGGER.info("Entered into ctaFavourite");

  let result;
  try {
    LOGGER.info(`Processing CTA favourite action with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.ctaFavourite(req);
    LOGGER.info(`BlogService.ctaFavourite response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.ctaFavourite: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully processed CTA favourite action");
      return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "");
    }
  } catch (error: any) {
    LOGGER.error("Error in ctaFavourite => ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      "Something went wrong !"
    );
  }
};

const saveUserCategory: IController = async (req: any, res) => {
  LOGGER.info("Entered into saveUserCategory");

  let result: any;
  try {
    LOGGER.info(`Saving user category with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.saveUserCategory(req);
    LOGGER.info(`BlogService.saveUserCategory response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.saveUserCategory: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully saved user category");
      return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "success");
    }
  } catch (error: any) {
    LOGGER.error("Error in saveUserCategory => ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      "Something went wrong !"
    );
  }
};
const getUserSavedCategory: IController = async (req: any, res: any) => {
  try {
    const result = await BlogService.getUserSavedCategory(req.params.blogId);

    if (result instanceof Error) {
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "Success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getBlogComments => ", error);
    return ApiResponseWithMessage.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

const ctaBlogRead: IController = async (req: any, res) => {
  LOGGER.info("Entered into ctaBlogRead");

  let result;
  try {
    LOGGER.info(`Processing blog read CTA with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.ctaBlogRead(req);
    LOGGER.info(`BlogService.ctaBlogRead response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.ctaBlogRead: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully processed blog read CTA");
      return ApiResponseWithMessage.result(res, result, httpStatusCodes.OK, "success");
    }
  } catch (error: any) {
    LOGGER.error("Error in ctaBlogRead => ", error);
    return apiResponse.error(
      res,
      httpStatusCodes.BAD_REQUEST,
      "Something went wrong !"
    );
  }
};

const ecomCoinTotal: IController = async (req: any, res) => {
  LOGGER.info("Entered into ecomCoinTotal");

  let result: any;
  try {
    LOGGER.info(`Fetching ecom coin total for user ID: ${req.session.id}`);

    result = await BlogService.ecomCoinTotal(req.session.id);
    LOGGER.info(`BlogService.ecomCoinTotal response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.ecomCoinTotal: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully fetched ecom coin total");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in ecomCoinTotal => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};

const ecomCoinUpdate: IController = async (req: any, res) => {
  LOGGER.info("Entered into ecomCoinUpdate");

  const userId = req.session.id;
  const { type, coins, orderid } = req.body;
  let result: any;

  LOGGER.info(`Updating ecom coins for User ID: ${userId}, Type: ${type}, Coins: ${coins}, Order ID: ${orderid}`);

  try {
    result = await BlogService.ecomCoinUpdate(userId, type, coins, orderid);
    LOGGER.info(`BlogService.ecomCoinUpdate response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.ecomCoinUpdate: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully updated ecom coins");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("ecomCoinUpdate => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const ecomTransactionFail: IController = async (req: any, res) => {
  LOGGER.info("Entered into ecomTransactionFail");

  const userId = req.session.id;
  const transactionId = req.query.transaction_id;
  let result: any;

  LOGGER.info(`Processing failed transaction for User ID: ${userId}, Transaction ID: ${transactionId}`);

  try {
    result = await BlogService.ecomTransactionFail(userId, transactionId);
    LOGGER.info(`BlogService.ecomTransactionFail response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      LOGGER.error(`Error from BlogService.ecomTransactionFail: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      LOGGER.info("Successfully processed failed transaction");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("ecomTransactionFail => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, error.message);
  }
};

const getAllCategories: IController = async (req: any, res) => {
  LOGGER.info("Entered into getAllCategories");
  let result, count;

  try {
    // Construct query dynamically
    const searchQuery = req.body.query?.trim() || "";
    const query = searchQuery
      ? ` WHERE (category_name LIKE '%${searchQuery}%' OR created_at LIKE '%${searchQuery}%')`
      : "";

    LOGGER.info(`Query for getAllCategories: ${query}`);

    // Fetch categories and count
    result = await BlogService.getAllCategories(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query,
      req.body.isAll,
      req.body.isBlog
    );

    count = await BlogService.getAllCategoriesCount(query, req.body.isAll, req.body.isBlog);

    // Handle service error
    if (result instanceof Error) {
      LOGGER.error(`Error in getAllCategories: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    // Success response
    return ApiResponseWithMessage.result(
      res,
      { data: result, total: count },
      httpStatusCodes.OK,
      "success"
    );

  } catch (error: any) {
    LOGGER.error("getAllCategories => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Something went wrong!");
  }
};

const getAllSubCategories: IController = async (req: any, res) => {
  LOGGER.info("Entered into getAllSubCategories");
  let result, count;

  try {
    // Construct query dynamically
    const searchQuery = req.body.query?.trim() || "";
    const query = searchQuery
      ? ` WHERE (bc.category_name LIKE '%${searchQuery}%' OR bsc.sub_category LIKE '%${searchQuery}%' OR bsc.created_at LIKE '%${searchQuery}%')`
      : "";

    LOGGER.info(`Query for getAllSubCategories: ${query}`);

    // Fetch subcategories and count
    result = await BlogService.getAllSubCategories(
      req.body.pageSize,
      req.body.pageIndex,
      req.body.sort,
      query,
      req.body.isAll,
      req.body.id
    );

    count = await BlogService.getAllSubCategoriesCount(query, req.body.isAll);

    // Handle service error
    if (result instanceof Error) {
      LOGGER.error(`Error in getAllSubCategories: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    // Success response
    return ApiResponseWithMessage.result(
      res,
      { data: result, total: count },
      httpStatusCodes.OK,
      "success"
    );

  } catch (error: any) {
    LOGGER.error("getAllSubCategories => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST, "Something went wrong!");
  }
};
const addComment: IController = async (req: any, res) => {
  LOGGER.info("Entered into create_Blog");

  let result: any;
  try {
    // LOGGER.info(`adding blog Comment with request data: ${JSON.stringify(req.body)}`);

    result = await BlogService.addBlogComment(req);
    // LOGGER.info(`BlogService.create_Blog response: ${JSON.stringify(result)}`);

    if (result instanceof Error) {
      // LOGGER.error(`Error from BlogService.create_Blog: ${result.message}`);
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      // LOGGER.info("Successfully created the blog");
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in create_Blog => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};
const getBlogComments: IController = async (req: any, res: any) => {
  try {
    const result = await BlogService.getBlogComments(req.params.blogId);

    if (result instanceof Error) {
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "Success"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in getBlogComments => ", error);
    return ApiResponseWithMessage.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};
const deleteComment: IController = async (req: any, res: any) => {
  try {
    const result = await BlogService.deleteComment(req.params.commentId);

    if (result instanceof Error) {
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    } else {
      return ApiResponseWithMessage.result(
        res,
        result,
        httpStatusCodes.OK,
        "Comment deleted successfully"
      );
    }
  } catch (error: any) {
    LOGGER.error("Error in deleteComment => ", error);
    return ApiResponseWithMessage.error(res, httpStatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};
const blockBlog: IController = async (req: any, res: any) => {
  try {
    const result = await BlogService.blockBlog(req);

    if (result instanceof Error) {
      return ApiResponseWithMessage.error(
        res,
        httpStatusCodes.BAD_REQUEST,
        result.message
      );
    }

    return ApiResponseWithMessage.result(
      res,
      result,
      httpStatusCodes.OK,
      "Blog blocked successfully"
    );
  } catch (error: any) {
    LOGGER.error("Error in blockBlog => ", error);
    return apiResponse.error(res, httpStatusCodes.BAD_REQUEST);
  }
};



export default {
  getUserSavedCategories,
  getBlogs,
  getBlogsbyID,
  getCategories,
  blogReadPoint,
  getBlogsForUserByCategory,
  ecomCoinTotal,
  ecomCoinUpdate,
  ecomTransactionFail,
  ctaLikes,
  getAllCategories,
  getAllSubCategories,
  ctaFavourite,
  ctaBlogRead,
  saveUserCategory,
  getCategoriesbyId,
  insert_blog_category,
  deleteBlogCategorybyId,
  updateBlogCategory,
  getSubCategoriesbyId,
  insert_blog_Subcategory,
  deleteBlogSubCategorybyId,
  updateBlogSubCategory,
  update_Blog,
  deleteBlogbyId,
  getBlogs_byId,
  create_Blog,
  getBlogsForShop,
  addComment,
  getBlogComments,
  deleteComment,
  blockBlog,
  getUserSavedCategory
};
