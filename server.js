require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("./models/User");

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function generateTicketNumber() {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
}

app.post("/create-order", async (req, res) => {
  const { username, email } = req.body;

  const options = {
    amount: 1000 * 100, // amount in paise
    currency: "INR",
    receipt: crypto.randomBytes(10).toString("hex"),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/verify-payment", async (req, res) => {
  const { username, email, orderId, paymentId, signature } = req.body;

  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === signature) {
    const ticketNumber = generateTicketNumber();
    const user = new User({
      username,
      email,
      ticketNumber,
      razorpayPaymentId: paymentId,
    });
    await user.save();
    res.json({ ticketNumber });
  } else {
    res.status(400).json({ message: "Invalid signature" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
