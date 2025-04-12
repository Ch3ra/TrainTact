const {
  initiateKhaltiPayment,
  verifyPidx,
  getPaymentStats,
  getRecentTransactions,
  updatePaymentStatus,
  exportPaymentData,
  processDirectPayment,
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

// NEW: Direct payment route
router.post("/direct/:bookingId", processDirectPayment)

module.exports = router