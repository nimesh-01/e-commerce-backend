const cartModel = require('../models/cart.model')

async function addItemToCart(req, res) {
    try {
        const { productId, qty } = req.body

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User not authenticated properly"
            });
        }

        let cart = await cartModel.findOne({ user: req.user.id })

        if (!cart) {
            cart = new cartModel({
                user: req.user.id,
                items: []
            })
        }

        const existingItemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId
        )

        if (existingItemIndex >= 0) {
            // Convert qty to number to ensure proper addition
            cart.items[existingItemIndex].quantity += parseInt(qty, 10)
        } else {
            cart.items.push({
                productId,
                quantity: parseInt(qty, 10)
            })
        }

        await cart.save()

        res.status(200).json({
            message: "Item added to cart",
            cart
        })
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({
            message: "Failed to add item to cart",
            error: error.message
        })
    }
}
async function updateItemToCart(req, res) {
    try {
        const { productId, qty } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User not authenticated properly"
            });
        }

        let cart = await cartModel.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const existingItemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId
        );

        if (existingItemIndex === -1) {
            return res.status(404).json({
                message: "Item not found in cart"
            });
        }

        // If qty is 0, remove the item from cart
        if (parseInt(qty, 10) === 0) {
            cart.items.splice(existingItemIndex, 1);
        } else {
            // Update the quantity
            cart.items[existingItemIndex].quantity = parseInt(qty, 10);
        }

        await cart.save();

        res.status(200).json({
            message: "Cart item updated successfully",
            cart
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            message: "Failed to update cart item",
            error: error.message
        });
    }
}
async function getCart(req, res) {
    const user = req.user
    let cart = await cartModel.findOne({ user: user._id })
    if (!cart) {
        cart = new cartModel({ user: user._id, items: [] })
        await cart.save()
    }
    res.status(200).json({
        cart,
        totals: {
            itemCount: cart?.items?.length || 0,
            totalQuantity: (cart?.items?.length > 0
                ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
                : [])
        }
    });
}
async function getCart(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User not authenticated properly"
            });
        }

        const cart = await cartModel.findOne({ user: req.user.id })
            .populate('items.productId', 'name price image') // Populate product details

        if (!cart) {
            return res.status(200).json({
                message: "Cart is empty",
                cart: {
                    user: req.user.id,
                    items: []
                }
            });
        }

        res.status(200).json({
            message: "Cart retrieved successfully",
            cart,
            itemCount: cart.items.length,
            totalQuantity: cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            message: "Failed to fetch cart",
            error: error.message
        });
    }
}
async function removeItemFromCart(req, res) {
    try {
        const { productId } = req.params;

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User not authenticated properly"
            });
        }

        let cart = await cartModel.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const existingItemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId
        );

        if (existingItemIndex === -1) {
            return res.status(404).json({
                message: "Item not found in cart"
            });
        }

        // Remove the item from cart
        cart.items.splice(existingItemIndex, 1);
        await cart.save();

        res.status(200).json({
            message: "Item removed from cart successfully",
            cart
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({
            message: "Failed to remove item from cart",
            error: error.message
        });
    }
}
async function clearCart(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User not authenticated properly"
            });
        }

        let cart = await cartModel.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        // Clear all items from cart
        cart.items = [];
        await cart.save();

        res.status(200).json({
            message: "Cart cleared successfully",
            cart
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            message: "Failed to clear cart",
            error: error.message
        });
    }
}

module.exports = { addItemToCart, updateItemToCart, getCart, removeItemFromCart, clearCart }