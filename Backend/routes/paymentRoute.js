const { initiateKhaltiPayment, verifyPidx, EsewaInitiatePayment, verifyEsewaPayment, } = require("../controller/payment/paymentController");

const router = require("express").Router();

//khalti Payment
router.route("/").post(initiateKhaltiPayment)
router.route("/success").get(verifyPidx)
router.route("/esewa/initiate").post(EsewaInitiatePayment)

module.exports= router
