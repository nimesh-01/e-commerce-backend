require('dotenv').config();
const app = require('./src/app')
const connectDb = require('./src/db/db')
const listener = require('./src/broker/listener')
const { connect } = require('./src/broker/broker')
connectDb();
connect().then(() => {
    listener()
})
app.listen(3007, () => {
    console.log('seller dashboard service is running on port 3007')
});
