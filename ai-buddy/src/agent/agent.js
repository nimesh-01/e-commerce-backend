const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph")
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { z } = require('zod')
const { ToolMessage, AIMessage, HumanMessage } = require('@langchain/core/messages')
const { searchProduct, addProductToCart } = require('../agent/tools')

// Define available tools
const availableTools = {
    searchProduct,
    addProductToCart
}

const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "models/gemini-2.5-flash",
    temperature: 0.5,
});

const graph = new StateGraph(MessagesAnnotation)
    .addNode('tools', async (state, config) => {
        const lastMessage = state.messages[state.messages.length - 1]
        const toolCalls = lastMessage.tool_calls

        const toolCallResults = await Promise.all(toolCalls.map(async (call) => {
            const tool = availableTools[call.name]
            if (!tool) {
                throw new Error(`Tool ${call.name} not found`);
            }
            const toolInput = call.args
            const toolResult = await tool.invoke({ ...toolInput, token: config.metadata.token })

            return new ToolMessage({ content: toolResult, name: call.name })
        }))
        state.messages.push(...toolCallResults)
        return state
    })
    .addNode('chat', async (state, config) => {
        const response = await model.invoke(state.messages, {
            tools: [availableTools.searchProduct, availableTools.addProductToCart]
        })
        state.messages.push(new AIMessage({ content: response.text, tool_calls: response.tool_calls }))

        return state
    })
    .addEdge("__start__", "chat")
    .addConditionalEdges('chat', async (state) => {
        const lastMessage = state.messages[state.messages.length - 1]
        if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            return "tools"
        }
        else {
            return "__end__"
        }
    })
    .addEdge("tools", "chat")

const agent = graph.compile()

module.exports = { agent }

module.exports = agent