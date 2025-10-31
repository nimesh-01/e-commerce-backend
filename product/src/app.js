const express = require('express')
const cors = require('cors')
require('dotenv').config()
const cookieParser = require('cookie-parser')
const app = express()

const productRoutes = require('./routes/product.routes')

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
    : [process.env.FRONTEND_URL || 'http://localhost:3000']
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true)
        return callback(new Error('CORS policy: This origin is not allowed'))
    },
    credentials: true,
}
app.use(cors(corsOptions))

// parse JSON bodies and cookies before routes
app.use(express.json())
app.use(cookieParser())
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Product service is running' })
})
app.use('/product', productRoutes)

module.exports = app;