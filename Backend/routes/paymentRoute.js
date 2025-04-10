const {
  initiateKhaltiPayment,
  verifyPidx,
  getPaymentStats,
  getRecentTransactions,
  updatePaymentStatus,
  exportPaymentData,
} = require("../controller/payment/paymentController")

const router = require("express").Router()

// Khalti payment routes
router.post("/khalti", initiateKhaltiPayment)
router.get("/khalti-success", verifyPidx)

// Dashboard data routes
router.get("/stats", getPaymentStats)
router.get("/transactions", getRecentTransactions)

// Payment management routes
router.put("/status/:bookingId", updatePaymentStatus)
router.get("/export", exportPaymentData)

module.exports = router

