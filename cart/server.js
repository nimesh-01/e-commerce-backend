require('dotenv').config()
const app = require('./src/app')
const connectDb=require('./src/db/db')


connectDb()
app.listen(3002, () => {
    console.log("Cart service is running on port 3002")
})