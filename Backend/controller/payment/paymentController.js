 // Add at top
const axios = require('axios');

//khalti Payment initiation
exports.initiateKhaltiPayment = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        
        if (!orderId || !amount) {
            return res.status(400).json({ message: "Please provide orderId and amount" });
        }

        const data = {
            return_url: "http://localhost:5173/payment/success",
            website_url: "http://localhost:3000/",
            purchase_order_id: orderId, 
            purchase_order_name: "Order Payment",
            amount: amount * 100, 
        };

        const response = await axios.post(
            "https://a.khalti.com/api/v2/epayment/initiate/",
            data,
            {
                headers: {
                    'Authorization': 'Key 25f7e11487c44a5f97d167d1ddb86c2c',
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(response.data)
        res.send(response.data.payment_url)
    } catch (error) {
        console.error("Khalti Payment Error:", error?.response?.data || error.message);
        res.status(500).json({ message: "Payment initiation failed", error: error?.response?.data || error.message });
    }
};
// In verifyPidx controller
exports.verifyPidx = async (req, res) => {
    try {
      const { pidx } = req.query;
      const response = await axios.post(
        "https://a.khalti.com/api/v2/epayment/lookup/",
        { pidx },
        { headers: { Authorization: 'Key your_secret_key_here' } }
      );
  
      if (response.data.status === 'Completed') {
        // Find and update the corresponding schedule
        await Schedule.findOneAndUpdate(
          { /* identification fields */ },
          { paymentStatus: 'paid' ,
            isClientVerified: true 
          },
        
        );
      }
      
      res.send(response.data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
