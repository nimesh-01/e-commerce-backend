const express = require('express')
const authroutes = require('./routes/auth.routes')
const cookieParser = require('cookie-parser')
const app = express()
app.use(express.json())
app.use(cookieParser())
app.get('/', (req, res) => {
    res.status(200).json({ message: "Auth service is running" })
})
app.use('/auth', authroutes)
module.exports = app