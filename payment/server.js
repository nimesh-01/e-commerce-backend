require('dotenv').config()
const app=require('./src/app')
const {connect}=require('./src/broker/broker')
const connectDb=require('./src/db/db')
connectDb()
connect()
app.listen(3004,()=>{
    console.log("Payment service is running on port 3004")
})