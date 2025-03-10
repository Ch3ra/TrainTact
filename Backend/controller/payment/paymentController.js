const { default: axios } = require("axios");




// eSewa Payment Integration
exports.initiateEsewaPayment = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        
        if (!orderId || !amount) {
            return res.status(400).json({ message: "Please provide orderId and amount" });
        }

        // Define eSewa specific parameters
        const tAmt = amount; 
        const amt = amount; 
        const txAmt = 0;
        const psc = 0; 
        const pdc = 0; 
        const scd = "EPAYTEST"; 
        const pid = orderId; 
        const su = "http://localhost:5173/success"; 
        const fu = "http://localhost:5173/failure";

        // Use the provided URL
        const paymentUrl = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

        // Return HTML form for redirection to eSewa
        const formHtml = `
            <html>
                <head>
                    <title>Redirecting to eSewa...</title>
                </head>
                <body>
                    <form id="esewaForm" action="${paymentUrl}" method="POST">
                        <input type="hidden" name="amt" value="${amt}">
                        <input type="hidden" name="psc" value="${psc}">
                        <input type="hidden" name="pdc" value="${pdc}">
                        <input type="hidden" name="txAmt" value="${txAmt}">
                        <input type="hidden" name="tAmt" value="${tAmt}">
                        <input type="hidden" name="pid" value="${pid}">
                        <input type="hidden" name="scd" value="${scd}">
                        <input type="hidden" name="su" value="${su}">
                        <input type="hidden" name="fu" value="${fu}">
                    </form>
                    <script>document.getElementById("esewaForm").submit();</script>
                </body>
            </html>
        `;
        
        // Send form for auto-submission
        res.set('Content-Type', 'text/html');
        res.send(formHtml);
    } catch (error) {
        console.error("eSewa Payment Error:", error.message);
        res.status(500).json({ message: "Payment initiation failed", error: error.message });
    }
};

// eSewa Payment Verification
exports.verifyEsewaPayment = async (req, res) => {
    try {
        const { pid, refId, amt, txnStatus } = req.query;

        if (!pid || !refId) {
            return res.status(400).json({ message: "Missing required parameters" });
        }

        // For production use: https://esewa.com.np/epay/transrec
        const verificationUrl = "https://uat.esewa.com.np/epay/transrec";
        
        const params = {
            amt: amt,
            rid: refId,
            pid: pid,
            scd: "EPAYTEST" // Replace with your merchant code
        };

        const response = await axios.get(verificationUrl, {
            params: params
        });

        // Check response - eSewa returns XML response
        if (response.data.includes('success')) {
            // Payment successful
            // Update your database or notify your frontend
            return res.status(200).json({ 
                status: 'completed',
                message: "Payment successful", 
                orderId: pid,
                transactionId: refId
            });
        } else {
            // Payment failed
            return res.status(400).json({ 
                status: 'failed',
                message: "Payment verification failed" 
            });
        }
    } catch (error) {
        console.error("eSewa Verification Error:", error.message);
        res.status(500).json({ 
            status: 'error',
            message: "Payment verification failed", 
            error: error.message 
        });
    }
};


//khalti Payment initiation
exports.initiateKhaltiPayment = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        
        if (!orderId || !amount) {
            return res.status(400).json({ message: "Please provide orderId and amount" });
        }

        const data = {
            return_url: "http://localhost:5173/success",
            website_url: "http://localhost:3000/",
            purchase_order_id: orderId, // bookingID
            purchase_order_name: "Order Payment",
            amount: amount * 100, // Convert to paisa
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


exports.verifyPidx=async(req,res)=>{
    const pidx=req.query.pidx
 const response = await axios.post("https://a.khalti.com/api/v2/epayment/lookup/",{pidx},
    {
        headers: {
            'Authorization': 'Key 25f7e11487c44a5f97d167d1ddb86c2c',
            },
    }
 )
 if(response.data.status=='completed'){
//notify to frontend
 }else{
//notify error to frontend
 }
 res.send(response.data);
}
