const { Server } = require('socket.io')
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const agent = require('../agent/agent')
async function initSocketServer(httpServer) {
    try {
        const io = new Server(httpServer, {});

        io.use((socket, next) => {
            try {
                const cookies = socket.handshake.headers?.cookie;
                if (!cookies) {
                    return next(new Error('No cookies provided'));
                }

                const { token } = cookie.parse(cookies);
                if (!token) {
                    return next(new Error('Token not provided'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;
                socket.token = token
                next();
            } catch (err) {
                console.error('Socket authentication error:', err.message);
                next(new Error('Authentication failed'));
            }
        });

        io.on('connection', (socket) => {
            console.log('Socket user:', socket.user);
            console.log("User connected successfully");

            socket.on('message', async (data) => {
                console.log('received message ', data)
                const agentResponse = await agent.invoke({
                    messages: [
                        {
                            role: "user",
                            content: data
                        }
                    ]
                }, {
                    metadata: {
                        token: socket.token
                    }
                })
                const lastMessage = agentResponse.messages[agentResponse.messages.length - 1]
                socket.emit('message', lastMessage.content)
            })
        });

        return io;
    } catch (error) {
        console.error('Socket server initialization failed:', error);
        throw error;
    }
}
module.exports = { initSocketServer }