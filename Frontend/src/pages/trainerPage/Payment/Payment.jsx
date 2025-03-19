import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from "crypto-js";
import { useLocation, useNavigate } from 'react-router-dom';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [trainerName, setTrainerName] = useState('');
  const [clientName, setClientName] = useState('');
  const [scheduleDetails, setScheduleDetails] = useState({});
  
  const transaction_uuid = uuidv4();
  const total_amount = location.state?.totalAmount || 0;
  
  // Get booking details from localStorage on component mount
  useEffect(() => {
    // Get trainer details and booking info from localStorage if available
    const bookingDetails = localStorage.getItem("bookingDetails");
    if (bookingDetails) {
      const parsedDetails = JSON.parse(bookingDetails);
      setScheduleDetails(parsedDetails);
    }
    
    // Get trainer name if passed through location state
    if (location.state?.trainerName) {
      setTrainerName(location.state.trainerName);
    }
    
    // Get client name from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setClientName(decodedToken.userName || "Client");
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [location.state]);
  
  // Create eSewa signature
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=EPAYTEST`;
  const hash = CryptoJS.HmacSHA256(message, "8gBm/:&EnhH.1/q");
  const hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
  
  // Mask transaction ID for display (only show first 4 and last 4 characters)
  const maskedTransactionId = transaction_uuid.length > 8 
    ? `${transaction_uuid.substring(0, 4)}...${transaction_uuid.substring(transaction_uuid.length - 4)}`
    : transaction_uuid;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-green-500 text-white text-center border-b border-gray-200">
          <img 
            src="https://esewa.com.np/common/images/esewa_logo.png" 
            alt="eSewa Logo" 
            className="h-10 mx-auto mb-3" 
          />
          <h2 className="text-xl font-medium">Complete Your Payment</h2>
        </div>
        
        {/* Payment Summary */}
        <div className="px-6 py-6 border-b border-gray-200">
          {trainerName && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-1">Trainer Details</h3>
              <p className="text-gray-700 text-sm">{trainerName}</p>
              
              {scheduleDetails.startDate && scheduleDetails.endDate && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>Schedule: {new Date(scheduleDetails.startDate).toLocaleDateString()} to {new Date(scheduleDetails.endDate).toLocaleDateString()}</p>
                  {scheduleDetails.startTime && <p>Time: {scheduleDetails.startTime}</p>}
                  {scheduleDetails.duration && <p>Duration: {scheduleDetails.duration} minutes</p>}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700">Total Amount:</span>
            <span className="text-2xl font-semibold text-gray-800">NPR {total_amount}</span>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Transaction ID: <span className="text-gray-700 font-medium">{maskedTransactionId}</span></p>
          </div>
        </div>

        {/* Form */}
        <form 
          action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" 
          method="POST"
          className="px-6 py-6"
        >
          <input type="hidden" id="amount" name="amount" value={total_amount} />
          <input type="hidden" id="tax_amount" name="tax_amount" value="0" />
          <input type="hidden" id="total_amount" name="total_amount" value={total_amount} />
          <input type="hidden" id="transaction_uuid" name="transaction_uuid" value={transaction_uuid} />
          <input type="hidden" id="product_code" name="product_code" value="EPAYTEST" />
          <input type="hidden" id="product_service_charge" name="product_service_charge" value="0" />
          <input type="hidden" id="product_delivery_charge" name="product_delivery_charge" value="0" />
          <input type="hidden" id="success_url" name="success_url" value="http://localhost:5173/esuccess" />
          <input type="hidden" id="failure_url" name="failure_url" value="http://localhost:5173/efailure" />
          <input type="hidden" id="signed_field_names" name="signed_field_names" value="total_amount,transaction_uuid,product_code" />
          <input type="hidden" id="signature" name="signature" value={hashInBase64} />
          
          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded font-semibold transition duration-200"
            >
              Pay with eSewa
            </button>
            
            <button 
              type="button"
              onClick={() => navigate(-1)} 
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-center text-sm text-gray-600">
          <p>Secured by eSewa Payment Services</p>
          <div className="flex justify-center items-center gap-1 mt-1 text-gray-700">
            <span className="text-base">🔒</span>
            <span>Secure Transaction</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;