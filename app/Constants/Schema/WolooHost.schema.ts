import { Joi, Segments } from "celebrate";

/**
 * Schema for WolooHost search API request validation
 * @typedef {Object} SearchWolooHostSchema
 * @property {Object} body - Request body schema
 * @property {string} [body.query] - Text search query for name, title, description, or pincode
 * @property {Object} [body.filters] - Search filters
 * @property {string} [body.filters.category] - Filter by WolooHost category
 * @property {number} [body.filters.rating] - Minimum rating filter (0-5)
 * @property {boolean} [body.filters.isOpen] - Filter by open/closed status
 * @property {boolean} [body.filters.hasOffers] - Filter by active offers availability
 * @property {Object} [body.filters.priceRange] - Price range filter
 * @property {number} [body.filters.priceRange.min] - Minimum price
 * @property {number} [body.filters.priceRange.max] - Maximum price
 * @property {Object} [body.location] - Location-based search parameters
 * @property {number} body.location.lat - Latitude coordinate
 * @property {number} body.location.lng - Longitude coordinate
 * @property {number} [body.location.radius] - Search radius in kilometers (default: 10)
 * @property {Object} [body.sort] - Sorting parameters
 * @property {string} [body.sort.field] - Field to sort by (name|rating|distance|price)
 * @property {string} [body.sort.order] - Sort order (asc|desc)
 * @property {Object} [body.pagination] - Pagination parameters
 * @property {number} [body.pagination.page] - Page number (default: 1)
 * @property {number} [body.pagination.limit] - Items per page (default: 10, max: 100)
 */
const searchWolooHost = {
  body: Joi.object({
    query: Joi.string().allow('').optional(),
    filters: Joi.object({
      category: Joi.string().optional(),
      rating: Joi.number().min(0).max(5).optional(),
      isOpen: Joi.boolean().optional(),
      hasOffers: Joi.boolean().optional(),
      priceRange: Joi.object({
        min: Joi.number().optional(),
        max: Joi.number().optional()
      }).optional()
    }).optional(),
    location: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
      radius: Joi.number().optional() // in kilometers
    }).optional(),
    sort: Joi.object({
      field: Joi.string().valid('name', 'rating', 'distance', 'price').optional(),
      order: Joi.string().valid('asc', 'desc').optional()
    }).optional(),
    pagination: Joi.object({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(10)
    }).optional()
  })
};

export default {
  fetchWolooHost: {
    [Segments.BODY]: Joi.object({
      pageSize: Joi.number().required(),
      pageIndex: Joi.number().required(),
      query: Joi.string().min(0),
      sort: Joi.object(),
    }).unknown(),
    [Segments.HEADERS]: Joi.object({
      "x-woloo-token": Joi.string().min(1).required(),
    }).unknown(),
  },


  submitReview: {
    [Segments.BODY]: Joi.object({
      woloo_id: Joi.number().optional(),
      rating: Joi.number().optional(),
      rating_option: Joi.array().min(1).optional(),
    }).unknown(),
  },

  deleteWolooHostById: {
    [Segments.QUERY]: Joi.object({
      id: Joi.number().required().min(1).message("Please enter ID"),
    }).unknown(),
  },

  fetchWolooHostById: {
    [Segments.HEADERS]: Joi.object({
      "x-woloo-token": Joi.string().min(1).required(),
    }).unknown(),
    [Segments.QUERY]: Joi.object({
      id: Joi.number().required().min(1).message("Please enter ID"),
    }).unknown(),
  },

  updateWolooHost: {
    [Segments.HEADERS]: Joi.object({
      "x-woloo-token": Joi.string().min(1).required(),
    }).unknown(),
  },

  searchWolooHost
};
