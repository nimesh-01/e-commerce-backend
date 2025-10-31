require('dotenv').config();
const paymentModel = require('../models/payment.model')
const axios = require('axios')
const { publishToQueue } = require('../broker/broker.js')
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


async function createPayment(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    const { orderId } = req.params;
    try {
        const orderResponse = await axios.get("http://localhost:3003/orders/" + orderId, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const price = orderResponse.data.order.totalPrice;
        const order = await razorpay.orders.create(price);
        const payment = await paymentModel.create({
            order: orderId,
            razorpayOrderId: order.id,
            user: req.user.id,
            price: {
                amount: price.amount,
                currency: price.currency
            }
        })
        await Promise.all([
            publishToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT_CREATED', payment),
            publishToQueue('PAYMENT_NOTIFICATION.PAYMENT_INITIATED', {
                email: req.user.email,
                orderId: orderId,
                amount: price.amount / 100,
                currency: price.currency,
                username: req.user.username
            })
        ])

        return res.status(200).json({ message: "Payment initiated", payment })

    } catch (err) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
async function verifyPayment(req, res) {
    const { razorpayOrderId, paymentId, signature } = req.body
    const secret = process.env.RAZORPAY_KEY_SECRET

    try {
        const { validatePaymentVerification } = require('../../node_modules/razorpay/dist/utils/razorpay-utils.js')

        const isvalid = validatePaymentVerification({ "order_id": razorpayOrderId, "payment_id": paymentId }, signature, secret);
        if (!isvalid) {
            return res.status(404).json({ message: "Payment not found" })
        }
        const payment = await paymentModel.findOne({ razorpayOrderId, status: "PENDING" });
        payment.paymentId = paymentId;
        payment.signature = signature;
        payment.status = 'COMPLETED';
        await payment.save();

        await Promise.all([
            publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", {
                email: req.user.email,
                orderId: payment.order,
                paymentId: payment.paymentId,
                amount: payment.price.amount / 100,
                currency: payment.price.currency
            }),
            publishToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE', payment)
        ])
        res.status(200).json({ message: 'Payment verified successfully', payment });

    } catch (error) {
        console.log(error);
        await publishToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", {
            email: req.user.email,
            paymentId: paymentId,
            orderId: razorpayOrderId,
            fullname: req.user.fullname
        })
        res.status(500).send('Error verifying payment');
    }
}
module.exports = { createPayment, verifyPayment }