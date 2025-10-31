const express = require('express')
const createAuthMiddleware = require('../middlewares/auth.middleware')
const { createOrder, getMyOrders, getOrderById, cancelOrderById, updateOrderAddress } = require('../controllers/order.controller')
const validation = require('../middlewares/validator.middleware')
const router = express.Router()

// post /orders
router.post('/', createAuthMiddleware(['user']), validation.createOrderValidation, createOrder)

//get /orders/me
router.get('/me', createAuthMiddleware(['user']), getMyOrders)

//post /orders/:id/cancel
router.post('/:id/cancel', createAuthMiddleware(['user']), cancelOrderById)

//patch /orders/:id/address
router.patch('/:id/address', createAuthMiddleware(['user']), validation.addressValidations, updateOrderAddress)

//get /orders/:id
router.get('/:id', createAuthMiddleware(['user', 'admin']), getOrderById)

module.exports = router