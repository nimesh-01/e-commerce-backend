const { body, validationResult } = require('express-validator')

// Reusable error response handler
const respondWithValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

// Product creation validations
const createProductValidations = [
  body('title')
    .isString().withMessage('Title must be a string')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters long'),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),

  body('priceAmount')
    .notEmpty().withMessage('Price amount is required')
    .isNumeric().withMessage('Price amount must be a number'),

  body('priceCurrency')
    .optional()
    .isIn(['USD', 'INR']).withMessage('Price currency must be one of USD or INR'),

  body('stock')
    .isNumeric().withMessage('Stock must be a number'),
  respondWithValidationErrors
]

module.exports = {
  createProductValidations,
  respondWithValidationErrors
}
