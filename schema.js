const Joi = require("joi");
const { CATEGORIES, PROPERTY_TYPES } = require("./utils/amenities.js");

const strOrArr = Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string());

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().trim().max(60).required(),
        description: Joi.string().trim().max(500).required(),
        location: Joi.string().trim().max(120).required(),
        country: Joi.string().trim().max(80).required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null),
        category: Joi.string().valid(...CATEGORIES),
        propertyType: Joi.string().valid(...PROPERTY_TYPES),
        guests: Joi.number().integer().min(1).max(16),
        bedrooms: Joi.number().integer().min(0).max(20),
        beds: Joi.number().integer().min(0).max(30),
        bathrooms: Joi.number().integer().min(0).max(20),
        amenities: strOrArr
    }).required(),
    removeImages: strOrArr
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().trim().required()
    }).required()
});
