const { 
    initiateKhaltiPayment, 
    verifyPidx,
    initiateEsewaPayment,
    verifyEsewaPayment 
} = require("../controller/payment/paymentController");

const router = require("express").Router();

// Khalti payment routes
router.post('/khalti', initiateKhaltiPayment);
router.get('/khalti-success', verifyPidx);

// eSewa payment routes
router.post('/esewa', initiateEsewaPayment);
router.get('/esewa-success', verifyEsewaPayment);

module.exports = router;