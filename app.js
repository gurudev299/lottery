const form = document.getElementById("purchase-form");
const errorElement = document.getElementById("card-errors");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;

  const response = await fetch("https://your-backend-url.com/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email }),
  });

  const data = await response.json();
  if (response.ok) {
    const options = {
      key: "your_razorpay_key_id",
      amount: 1000 * 100,
      currency: "INR",
      name: "Lottery System",
      description: "Ticket Purchase",
      order_id: data.orderId,
      handler: async function (response) {
        const paymentData = {
          username,
          email,
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        };

        const verifyResponse = await fetch(
          "https://your-backend-url.com/verify-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentData),
          }
        );

        const verifyData = await verifyResponse.json();
        if (verifyResponse.ok) {
          document.getElementById("receipt-name").textContent = username;
          document.getElementById("ticket-number").textContent =
            verifyData.ticketNumber;
          document.getElementById("purchase-form").style.display = "none";
          document.getElementById("receipt").style.display = "block";
        } else {
          alert(verifyData.message);
        }
      },
      prefill: {
        name: username,
        email: email,
      },
    };

    const paymentObject = new Razorpay(options);
    paymentObject.open();
  } else {
    alert(data.message);
  }
});
