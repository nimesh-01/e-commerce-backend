const express = require('express')
const validators = require('../middlewares/validator.middleware')
const authController = require('../controller/auth.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const router = express.Router()
// Post /auth/register
router.post('/register', validators.registerUserValidations, authController.registerUser)

// Post /auth/login
router.post('/login', validators.loginUserValidations, authController.loginUser)

// get /auth/me
router.get('/me', authMiddleware.authMiddleware, authController.getCurrentUser)

//get /auth/logout
router.get('/logout', authController.logoutUser)

//get  /auth/users/me/addresses
router.get('/users/me/addresses', authMiddleware.authMiddleware, authController.getUserAddresses)

//post  /auth/users/me/addresses
router.post('/users/me/addresses', validators.addressValidations, authMiddleware.authMiddleware, authController.addUserAddress)

//delete  /auth/users/me/addresses:addressId
router.delete('/users/me/addresses/:addressId',authMiddleware.authMiddleware, authController.deleteUserAddress)

module.exports = router