const { default: axios } = require("axios");

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


//Esewa Payment Initiation
 

exports.EsewaInitiatePayment=async(req,res)=>{
    const { amount, productId } = req.body;  //data coming from frontend
try {
    const  reqPayment =await EsewaPaymentGateway(
        amount,0,0,0,productId,process.env.MERCHANT_ID,process.env.SECRET,process.env.SUCCESS_URL,process.env.FAILURE_URL,process.env.ESEWAPAYMENT_URL,undefined,undefined)

        if(!reqPayment){
            return res.status(400).json("error sending data")
            
        }

      if (reqPayment.status === 200) {
                console.log(reqPayment.request.res.responseUrl)
                return res.send({
                  url: reqPayment.request.res.responseUrl,
                });
              }
 }
catch (error) {
return res.status(400).json("error sending data")

 }}



// const paymentStatus=async (req, res) => {
//             const { product_id } = req.body; // Extract data from request body
//             try {
//               // Find the transaction by its signature
//               const transaction = await Transaction.findOne({ product_id });
//               if (!transaction) {
//                 return res.status(400).json({ message: "Transaction not found" });
//               }
          
//          const paymentStatusCheck=await   EsewaCheckStatus(transaction.amount,transaction.product_id,process.env.MERCHANT_ID,process.env.ESEWAPAYMENT_STATUS_CHECK_URL)
      
          
          
//               if (paymentStatusCheck.status === 200) {
//                 // Update the transaction status
//                 transaction.status = paymentStatusCheck.data.status;
//                 await transaction.save();
//                 res
//                   .status(200)
//                   .json({ message: "Transaction status updated successfully" });
//               }
//             } catch (error) {
//               console.error("Error updating transaction status:", error);
//               res.status(500).json({ message: "Server error", error: error.message });
//             }
//           };
