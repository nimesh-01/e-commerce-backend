const { tool } = require('@langchain/core/tools')
const { z } = require('zod')
const axios = require('axios')

const searchProduct = tool(async ({ query, token }) => {
    try {
        const response = await axios.get(`http://localhost:3001/product?q=${encodeURIComponent(query)}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        return JSON.stringify(response.data)
    } catch (error) {
        console.error('Search product error:', error.message)
        throw new Error(`Failed to search products: ${error.message}`)
    }
}, {
    name: "searchProduct",
    description: "Search for product based on a query",
    inputSchema: z.object({
        query: z.string().describe("The search query for products"),
        token: z.string().describe("The authentication token")
    })
})

const addProductToCart = tool(async ({ productId, quantity = 1, token }) => {
    try {
        const response = await axios.post(`http://localhost:3002/cart/items`, {
            productId,
            quantity
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        return JSON.stringify(response.data)
    } catch (error) {
        console.error('Add to cart error:', error.message)
        throw new Error(`Failed to add product to cart: ${error.message}`)
    }
}, {
    name: "addProductToCart",
    description: "Add a product to the shopping cart",
    inputSchema: z.object({
        productId: z.string().describe("The id of the product to add to the cart"),
        quantity: z.number().describe("The quantity of the product to add to the cart").default(1),
        token: z.string().describe("The authentication token")
    })
})

module.exports = { searchProduct, addProductToCart }