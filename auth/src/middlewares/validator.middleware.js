const { body, validationResult } = require('express-validator')

const respondWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next()
}
const registerUserValidations = [
    body("username")
        .isString()
        .withMessage("Username must be a string")
        .isLength({ min: 3 })
        .withMessage('Username must be 3 charaters long'),
    body("email")
        .isString()
        .withMessage("Email must be a string"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be 6 digits longer"),
    body("fullname.firstname")
        .isString()
        .withMessage("Firstname must be string")
        .notEmpty()
        .withMessage("Firstname is required"),
    body("fullname.lastname")
        .isString()
        .withMessage("Lastname must be string"),
    body('role')
        .optional()
        .isIn(['user', 'seller'])
        .withMessage("Role must be either 'user' and 'seller'"),
    respondWithValidationErrors
]
const loginUserValidations = [
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be 6 digits longer"),
    body().custom(body => {
        if (!body.username && !body.email) {
            throw new Error("Either username or email is required");
        }
        return true;
    }),
    respondWithValidationErrors
]
const addressValidations = [
    body('street')
        .isString().withMessage('Street must be a string')
        .notEmpty().withMessage('Street is required'),
    body('city')
        .isString().withMessage('City must be a string')
        .notEmpty().withMessage('City is required'),
    body('state')
        .isString().withMessage('State must be a string')
        .notEmpty().withMessage('State is required'),
    body('pincode')
        .isString().withMessage('Pincode must be a string')
        .notEmpty().withMessage('Pincode is required'),
    body('country')
        .isString().withMessage('Country must be a string')
        .notEmpty().withMessage('Country is required'),
    body('isDefault')
        .optional().isBoolean().withMessage('isDefault must be a boolean'),
    respondWithValidationErrors
];
module.exports = {
    registerUserValidations,
    loginUserValidations,
    addressValidations
}