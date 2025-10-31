const express = require('express')
const { connect, subscribeToQueue } = require('./broker/broker')
const setListeners = require('./broker/listeners')
const app = express()
connect().then(() => {
    setListeners()
})
app.get('/', (req, res) => {
    res.status(200).json({ message: "Notification service is running" })
})
app.use(express.json())
module.exports = app