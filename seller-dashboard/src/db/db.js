const mongoose = require('mongoose')

async function connectDb() {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Database Connected")
    }
    catch (err) {
        console.error('Database coonection error : ', err)
    }
}
module.exports=connectDb
