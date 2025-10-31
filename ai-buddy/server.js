require('dotenv').config()
const app = require('./src/app')

const http = require('http')
const { initSocketServer } = require('./src/sockets/socket.server')

const httpServer = http.createServer(app)
initSocketServer(httpServer)
httpServer.listen(3005, () => {
    console.log("Ai buddy service is running on port 3005")
})