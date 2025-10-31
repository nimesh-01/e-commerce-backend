const orderModel = require('../models/order.model')
const mongoose = require('mongoose')
const axios = require('axios')
const {publishToQueue}=require('../broker/broker')
async function createOrder(req, res) {
    const user = req.user
    const authHeader = req.headers?.authorization
    const token = req.cookies?.token || (typeof authHeader === 'string'
        ? (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader)
        : undefined)
    try {
        // Fetch cart
        let cartResponse
        try {
            cartResponse = await axios.get(`http://localhost:3002/cart`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
        } catch (e) {
            console.error('Cart service request failed', e.response?.status, e.response?.data || e.message)
            // forward meaningful error to client
            const status = e.response?.status || 502
            return res.status(status).json({ message: 'Failed to fetch cart', detail: e.response?.data || e.message })
        }


        const cartItems = cartResponse.data.cart.items;
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                message: "Cart is empty"
            });
        }
        // Fetch product details and check stock
        const products = await Promise.all(cartItems.map(async (item) => {
            let productResponse
            try {
                productResponse = await axios.get(`http://localhost:3001/product/${item.productId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                })
            } catch (e) {
                console.error(`Product service request failed for ${item.productId}`, e.response?.status, e.response?.data || e.message)
                const status = e.response?.status || 502
                throw Object.assign(new Error('Failed to fetch product details'), { status, detail: e.response?.data || e.message })
            }

            const product = productResponse.data.product;
            // Check if requested quantity is available
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
            }
            // // Normalize price: product.price may be a number or an object { amount, currency }
            let priceAmount = null;
            let currency = null;
            if (product && typeof product.price === 'object' && product.price !== null) {
                priceAmount = Number(product.price.amount ?? product.price);
                currency = product.price.currency || product.currency || 'INR';
            } else {
                priceAmount = Number(product.price ?? product.price);
                currency = product.currency || 'INR';
            }
            if (Number.isNaN(priceAmount)) {
                throw new Error(`Invalid price for product ${product.name}`);
            }

            return {
                product,
                quantity: Number(item.quantity) || 0,
                priceAmount,
                currency
            };
        }));

        // Calculate total amount
        const totalAmount = products.reduce((total, item) => {
            return total + (item.priceAmount * item.quantity);
        }, 0);

        // Validate shipping address
        if (!req.body.shippingAddress) {
            return res.status(400).json({
                message: "Shipping address is required"
            });
        }

        //     // Create order using schema shape from order.model.js
        //     // determine currency from product if available, otherwise default to INR
        const defaultCurrency = products[0]?.currency || 'INR';
        const order = await orderModel.create({
            user: user.id,
            items: products.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: {
                    amount: item.priceAmount,
                    currency: item.currency || defaultCurrency
                }
            })),
            status: 'PENDING',
            totalPrice: {
                amount: totalAmount,
                currency: defaultCurrency
            },
            shippingAddress: req.body.shippingAddress
        });

        // Update product stock
        // await Promise.all(products.map(async (item) => {
        //     console.log("ye items h: ", item)
        //     const newStock = item.product.stock - item.quantity;
        //     console.log("ye newAStock h: ", newStock)

        //     await axios.patch(`http://localhost:3001/product/${item.product._id}`,
        //         { stock: newStock },
        //         {
        //             headers: {
        //                 Authorization: `Bearer ${token}`
        //             }
        //         }
        //     );
        // }));

        // Clear cart after successful order
        await axios.delete(`http://localhost:3002/cart`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        await publishToQueue('ORDER_SELLER_DASHBOARD.ORDER_CREATED', order)
        return res.status(201).json({
            message: "Order created successfully",
            order
        });
    }
    catch (err) {
        console.error("Error creating order:", err);
        return res.status(500).json({
            message: err.message || "Internal server error",
            error: err.message
        });
    }
}
async function getMyOrders(req, res) {
    try {
        const user = req.user
        const page = Math.max(1, parseInt(req.query.page || '1', 10))
        const limit = Math.max(1, parseInt(req.query.limit || '10', 10))
        const skip = (page - 1) * limit

        const filter = { user: user.id }
        if (req.query.status) {
            // accept status in any case, store uses UPPERCASE enums
            filter.status = String(req.query.status).toUpperCase()
        }

        // basic sorting support: e.g. ?sort=createdAt or ?sort=-createdAt
        const sort = req.query.sort || '-createdAt'

        // fetch orders, lightweight using lean()
        const [orders, total] = await Promise.all([
            orderModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            orderModel.countDocuments(filter)
        ])

        return res.status(200).json({
            message: 'Orders fetched successfully',
            page,
            limit,
            total,
            orders
        })
    } catch (err) {
        console.error('Error fetching orders for user:', err)
        return res.status(500).json({ message: 'Failed to fetch orders', error: err.message })
    }
}
async function getOrderById(req, res) {
    const user = req.user
    const { id } = req.params

    try {
        // validate ObjectId format first
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order id format' })
        }
        const order = await orderModel.findById(id)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }
        if (order.user.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden : you do not access the order " })
        }
        return res.status(200).json({
            message: "Order Fetched successfully",
            order
        })
    } catch (err) {
        return res.status(500).json({ message: "Error from fecthing order" })
    }

}
async function cancelOrderById(req, res) {
    const user = req.user
    const { id } = req.params

    try {
        // validate ObjectId format first
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order id format' })
        }
        const order = await orderModel.findById(id)
        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }
        if (order.user.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden : you do not access the order " })
        }
        if (order.status !== "PENDING") {
            return res.status(409).json({ message: "Order cannot be cancelled at this state" })
        }
        order.status = "CANCELLED"
        await order.save()
        return res.status(200).json({
            message: "Order Cancelled successfully",
            order
        })
    } catch (err) {
        return res.status(500).json({ message: "Error from fetching order" })
    }

}
async function updateOrderAddress(req, res) {
    const user = req.user
    const { id } = req.params

    try {
        // validate ObjectId format first
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order id format' })
        }
        const order = await orderModel.findById(id)

        if (!order) {
            return res.status(404).json({ message: "Order not found" })
        }
        if (order.user.toString() !== user.id) {
            return res.status(403).json({ message: "Forbidden : you do not access the order " })
        }
        if (order.status !== "PENDING") {
            return res.status(409).json({ message: "Order cannot be cancelled at this state" })
        }
        order.shippingAddress = {
            street: req.body.shippingAddress.street,
            city: req.body.shippingAddress.city,
            state: req.body.shippingAddress.state,
            pincode: req.body.shippingAddress.pincode,
            country: req.body.shippingAddress.country
        }
        await order.save()
        return res.status(200).json({
            message: "Order Address updated successfully",
            order
        })
    } catch (err) {
        return res.status(500).json({ message: "Error from fecthing order" })
    }
}
module.exports = { createOrder, getMyOrders, getOrderById, cancelOrderById, updateOrderAddress }