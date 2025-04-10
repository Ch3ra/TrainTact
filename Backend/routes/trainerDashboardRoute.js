const express = require("express")
const router = express.Router()
const TrainerDashboardController = require("../controller/TrainerDashboardController/trainerDashboardController")

/**
 * @route   GET /api/trainer-dashboard/:trainerId/overview
 * @desc    Get dashboard overview statistics for a trainer
 * @access  Private (Trainer only)
 */
router.get("/:trainerId/overview", TrainerDashboardController.getDashboardOverview)

/**
 * @route   GET /api/trainer-dashboard/:trainerId/earnings
 * @desc    Get earnings overview for a trainer
 * @access  Private (Trainer only)
 */
router.get("/:trainerId/earnings", TrainerDashboardController.getEarningsOverview)

/**
 * @route   GET /api/trainer-dashboard/:trainerId/session-types
 * @desc    Get session types distribution based on client fitness goals
 * @access  Private (Trainer only)
 */
router.get("/:trainerId/session-types", TrainerDashboardController.getSessionTypes)

/**
 * @route   GET /api/trainer-dashboard/:trainerId/recent-sessions
 * @desc    Get recent sessions for a trainer
 * @access  Private (Trainer only)
 */
router.get("/:trainerId/recent-sessions", TrainerDashboardController.getRecentSessions)

/**
 * @route   GET /api/trainer-dashboard/:trainerId/booking-stats
 * @desc    Get booking statistics for a trainer
 * @access  Private (Trainer only)
 */
router.get("/:trainerId/booking-stats", TrainerDashboardController.getBookingStats)

/**
 * @route   GET /api/trainer-dashboard/:trainerId/payment-transactions
 * @desc    Get payment transactions for a trainer
 * @access  Private (Trainer only)
 */
router.get("/:trainerId/payment-transactions", TrainerDashboardController.getPaymentTransactions)

/**
 * @route   GET /api/trainer-dashboard/transaction/:transactionId
 * @desc    Get details of a specific transaction
 * @access  Private (Trainer only)
 */
router.get("/transaction/:transactionId", TrainerDashboardController.getTransactionDetails)

/**
 * @route   PATCH /api/trainer-dashboard/update-payment-status/:transactionId
 * @desc    Update payment status from pending to paid
 * @access  Private (Trainer only)
 */
router.patch("/update-payment-status/:transactionId", TrainerDashboardController.updatePaymentStatus)



module.exports = router

