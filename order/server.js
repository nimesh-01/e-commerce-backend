require('dotenv').config()
const app = require('./src/app')
const connectDb = require('./src/db/db')
const {connect}=require('./src/broker/broker')
connectDb()
connect()
app.listen(3003, () => {
    console.log("Order service is running on port 3003")
})