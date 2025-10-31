const { body, validationResult } = require('express-validator')
const mongoose = require('mongoose')

const respondWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next()
}

const createOrderValidation = [
    body('shippingAddress.street')
        .isString().withMessage('Street must be a string')
        .notEmpty().withMessage('Street is required'),

    body('shippingAddress.city')
        .isString().withMessage('City must be a string')
        .notEmpty().withMessage('City is required'),

    body('shippingAddress.state')
        .isString().withMessage('State must be a string')
        .notEmpty().withMessage('State is required'),

    body('shippingAddress.pincode')
        .isString().withMessage('Pincode must be a string')
        .notEmpty().withMessage('Pincode is required')
        .bail()
        .matches(/^\d{4,}$/).withMessage('Pincode must be at least 4 digits'),

    body('shippingAddress.country')
        .isString().withMessage('Country must be a string')
        .notEmpty().withMessage('Country is required'),
    respondWithValidationErrors
];
const addressValidations = [
    body('shippingAddress.street')
        .isString().withMessage('Street must be a string')
        .notEmpty().withMessage('Street is required'),
    body('shippingAddress.city')
        .isString().withMessage('City must be a string')
        .notEmpty().withMessage('City is required'),
    body('shippingAddress.state')
        .isString().withMessage('State must be a string')
        .notEmpty().withMessage('State is required'),
    body('shippingAddress.pincode')
        .isString().withMessage('Pincode must be a string')
        .notEmpty().withMessage('Pincode is required'),
    body('shippingAddress.country')
        .isString().withMessage('Country must be a string')
        .notEmpty().withMessage('Country is required'),
    body('shippingAddress.isDefault')
        .optional().isBoolean().withMessage('isDefault must be a boolean'),
    respondWithValidationErrors
];
module.exports = {
    createOrderValidation,
    addressValidations
}