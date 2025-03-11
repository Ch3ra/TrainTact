 // Add at top
const axios = require('axios');

const { parseString } = require('xml2js');

// eSewa Payment Integration - Fixed
exports.initiateEsewaPayment = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        
        if (!orderId || !amount) {
            return res.status(400).json({ message: "Please provide orderId and amount" });
        }

        // Convert amount to NPR (remove paisa conversion)
        const numericAmount = Number(amount).toFixed(2);

        const params = {
            amt: numericAmount,
            psc: 0,
            pdc: 0,
            txAmt: 0,
            tAmt: numericAmount,
            pid: orderId.toString(),
            scd: "EPAYTEST",
            su: "http://localhost:5173/success",
            fu: "http://localhost:5173/failure"
        };

        const paymentUrl = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

        const formHtml = `
            <html>
                <head>
                    <title>Redirecting to eSewa...</title>
                </head>
                <body>
                    <form id="esewaForm" action="${paymentUrl}" method="POST">
                        ${Object.entries(params).map(([key, value]) => `
                            <input type="hidden" name="${key}" value="${value}">
                        `).join('')}
                    </form>
                    <script>
                        document.getElementById("esewaForm").submit();
                        window.onload = function() {
                            document.getElementById("esewaForm").submit();
                        }
                    </script>
                </body>
            </html>
        `;
        
        res.set('Content-Type', 'text/html');
        res.send(formHtml);
    } catch (error) {
        console.error("eSewa Payment Error:", error);
        res.status(500).json({ message: "Payment initiation failed", error: error.message });
    }
};

// eSewa Payment Verification - Fixed
exports.verifyEsewaPayment = async (req, res) => {
    try {
        const { pid, refId, amt } = req.query;

        if (!pid || !refId || !amt) {
            return res.status(400).json({ message: "Missing required parameters" });
        }

        const verificationUrl = "https://uat.esewa.com.np/epay/transrec";
        const params = {
            amt: amt,
            rid: refId,
            pid: pid,
            scd: "EPAYTEST"
        };

        const response = await axios.get(verificationUrl, { params });

        // Proper XML parsing
        parseString(response.data, (err, result) => {
            if (err) {
                console.error("XML Parse Error:", err);
                return res.status(500).json({ 
                    status: 'error',
                    message: "Payment verification failed" 
                });
            }

            const responseCode = result?.response?.response_code?.[0];
            if (responseCode === 'Success') {
                return res.status(200).json({ 
                    status: 'success',
                    message: "Payment successful", 
                    orderId: pid,
                    transactionId: refId,
                    amount: amt
                });
            } else {
                return res.status(400).json({ 
                    status: 'failed',
                    message: "Payment verification failed" 
                });
            }
        });

    } catch (error) {
        console.error("eSewa Verification Error:", error);
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
