const mongoose = require('mongoose')

async function connectDb() {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Database coonected successfully")
    }
    catch (err) {
        console.error("Database connection error : ", err)
    }
}
module.exports = connectDb