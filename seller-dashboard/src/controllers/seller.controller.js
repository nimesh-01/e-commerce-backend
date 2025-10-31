const userModel = require('../models/user.model')
const paymentModel = require('../models/payment.model')
const productModel = require('../models/product.model')
const orderModel = require('../models/order.model')


async function getMetrics(req, res) {
    try {
        const seller = req.user;

        // Get all products for this seller
        const products = await productModel.find({ seller: seller });
        const productIds = products.map(p => p._id);

        // Get all orders containing seller's products
        const orders = await orderModel.find({
            'items.product': { $in: productIds },
            status: { $in: ["CONFIRMED", "SHIPPED", "DELIVERED"] }
        });

        // Sales: total number of items sold
        let sales = 0;
        let revenue = 0;
        const productSales = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                // Check if the product ID from the order item is in the seller's product list
                // Note: A more robust way might be `productIds.some(id => id.equals(item.product))`
                if (productIds.includes(item.product)) {
                    sales += item.quantity;
                    revenue += item.price.amount * item.quantity;

                    // Aggregate sales by product ID
                    productSales[item.product] = (productSales[item.product] || 0) + item.quantity;
                }
            });
        });

        // Top products by quantity sold
        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1]) // Sort descending by quantity (index 1)
            .slice(0, 5) // Get top 5
            .map(([productId, qty]) => {
                // Find the full product details
                const prod = products.find(p => p._id.equals(productId));
                // Return details (or null if product not found, e.g., deleted)
                return prod ? { id: prod._id, title: prod.title, qty } : null;
            })
            .filter(Boolean); // Filter out any null entries

        return res.json({
            sales,
            revenue,
            topProducts
        });

    } catch (error) {
        console.error("Error fetching metrics:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}
async function getOrders(req, res) {
    try {
        const seller = req.user;

        // Get all products for this seller
        const products = await productModel.find({ seller: seller });
        const productIds = products.map(p => p._id);
        // Assuming this is part of an async function like 'try {' block

        const orders = await orderModel.find({
            'items.product': { $in: productIds }
        }).populate('user', 'name email').sort({ createdAt: -1 });

        // Filter order items to only include those from this seller
        const filteredOrders = orders.map(order => {
            const filteredItems = order.items.filter(item => productIds.includes(item.product));
            return {
                ...order.toObject(),
                items: filteredItems
            };
        }).filter(order => order.items.length > 0);

        return res.json(filteredOrders);

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}
async function getProducts(req, res) {
    try {
        const seller = req.user;
        const products = await productModel.find({ seller: seller })
        return res.json(products);

    } catch (err) {
        console.error("Error fetching Products:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}
module.exports = { getMetrics,getOrders, getProducts}