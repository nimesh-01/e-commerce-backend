const mongoose = require('mongoose')

async function connectDb() {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Connected to DB")
    } catch (err) {
        console.error("Error connecting to database ",err)
    }
}

module.exports=connectDb