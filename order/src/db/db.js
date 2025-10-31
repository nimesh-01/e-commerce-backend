const mongoose = require('mongoose')

async function connectDb() {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log('Database connected')
    } catch (err) {
        console.error("Database Connection failed : ", err)
    }
}
module.exports = connectDb