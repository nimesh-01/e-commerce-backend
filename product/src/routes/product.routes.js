const express = require('express')
const router = express.Router()
const createAuthMiddleware = require('../middlewares/auth.middleware')
const upload = require('../middlewares/upload.middleware')
const productController = require('../controllers/product.controller')
const { createProductValidations } = require('../middlewares/product.middleware')

//post /product
router.post('/',
	createAuthMiddleware(['admin', 'seller']),
	upload.array('images', 5),
	createProductValidations,
	productController.createProduct
)
//get /product
router.get('/', productController.getProducts)

//patch /product:id
router.patch('/:id', createAuthMiddleware(['seller']), productController.updateProduct)

//delete /product:id
router.delete('/:id', createAuthMiddleware(["seller"]), productController.deleteProduct)

//get /product/seller
router.get('/seller',createAuthMiddleware(['seller']),productController.getProductsBySeller)

//get /product:id
router.get('/:id', productController.getProductById)
module.exports = router