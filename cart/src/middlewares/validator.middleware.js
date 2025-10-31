const { body, validationResult } = require('express-validator')
const mongoose = require('mongoose')

const respondWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next()
}
const ValidateAddItemToCart = [
    body('productId')
        .isString()
        .withMessage("Product Id must be a string")
        .custom(value => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid product ID Format"),
    body('qty')
        .isInt({ gt: 0 })
        .withMessage("Quantity must be a positive number"),
    respondWithValidationErrors
]
const ValidateUpdateItemToCart = [
    body('productId')
        .isString()
        .withMessage("Product Id must be a string")
        .custom(value => mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid product ID Format"),
    body('qty')
        .isInt({ min: 0 })
        .withMessage("Quantity must be zero or a positive number"),
    respondWithValidationErrors
]
module.exports = {
    ValidateAddItemToCart,
    ValidateUpdateItemToCart
}