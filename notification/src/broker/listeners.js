const { subscribeToQueue } = require('./broker')
const sendEmail = require('../email')

module.exports = async () => {
  subscribeToQueue("AUTH_NOTIFICATION.USER_CREATED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Welcome to Our Service!</h1>
    <p>Dear ${data.fullname?.firstname || ""} ${data.fullname?.lastname || ""},</p>
    <p>Thank you for registering with us. We're excited to have you on board! 🚀</p>
    <p>Best regards,<br>The Team</p>
  `;

    await sendEmail(
      data.email,
      "Welcome to Our Service 🎉",
      "Thank you for registering with us!",
      emailHTMLTemplate
    );
  });
  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", async (data) => {
    const emailHTMLTemplate = `
   <h1>Payment Initiated  ✅/h1>
   <p>Dear ${data.username},</p>
   <p>Unfortunately, your payment for the orderId : ${data.orderId} has initiated</p>
   <p>We will notify you once the payment is completed.</p>
   <p>Best regards,<br>The Team</p>
 `;

    await sendEmail(
      data.email,
      "Payment Initiated",
      `Your payment for the orderId : ${data.orderId} has initiated  ✅`,
      emailHTMLTemplate
    );
  });
  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Payment Successful! ✅</h1>
    <p>Dear ${data.username},</p>
    <p>We have received your payment of ${data.currency} ${data.amount} for the order successfully.</p>
    <p>Thank you for your purchase! 🎉</p>
    <p>Best regards,<br>The Team</p>
  `;

    await sendEmail(
      data.email,
      "Payment Successful ✅",
      `We have received your payment of ${data.currency} ${data.amount}.`,
      emailHTMLTemplate
    );
  });
  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", async (data) => {
    const emailHTMLTemplate = `
    <h1>Payment Failed ❌</h1>
    <p>Dear ${data.username},</p>
    <p>Unfortunately, your payment for the orderId : ${data.orderId} has failed</p>
    <p>Please try again later or contact support if the issue persists.</p>
    <p>Best regards,<br>The Team</p>
  `;

    await sendEmail(
      data.email,
      "Payment Failed ❌",
      `Your payment for the orderId : ${data.orderId} has failed. Please try again.`,
      emailHTMLTemplate
    );
  });
 subscribeToQueue("PRODUCT_NOTIFICATION.PRODUCT_CREATED", async (data) => {
    const emailHTMLTemplate = `
      <h1>New Product Available!</h1>
      <p>Dear ${data.username},</p>
      <p>Check it out and enjoy exclusive launch offers!</p>
      <p>Best regards,<br>The Team</p>
    `;

    await sendEmail(
      data.email,
      "New Product Launched 🚀",
      "Check out our newly launched product!",
      emailHTMLTemplate
    );
});

}