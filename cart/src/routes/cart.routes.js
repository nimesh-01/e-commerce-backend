const express = require('express')
const router = express.Router()
const createAuthMiddleware = require('../middlewares/auth.middleware')
const cartController = require('../controllers/cart.controller')
const Validation = require('../middlewares/validator.middleware')

//get /cart
router.get('/', createAuthMiddleware(['user']),cartController.getCart)

//post /cart/items
router.post('/items', createAuthMiddleware(['user']), Validation.ValidateAddItemToCart, cartController.addItemToCart)

//patch /cart/items/:productId
router.patch('/items/:productId', createAuthMiddleware(['user']), Validation.ValidateUpdateItemToCart, cartController.updateItemToCart)

//delete /cart/items/:productId
router.delete('/items/:productId', createAuthMiddleware(['user']), cartController.removeItemFromCart)

//delete /cart
router.delete('/', createAuthMiddleware(['user']), cartController.clearCart)

module.exports = router