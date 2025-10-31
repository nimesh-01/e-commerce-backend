const mongoose = require('mongoose')

async function connectDb() {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Database connected successfully")
    } catch (err) {
        console.log("Mongoose connection error : ", err)
    }
}
module.exports = connectDb;
