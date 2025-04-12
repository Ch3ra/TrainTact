const axios = require("axios")
const WorkoutSchedule = require("../../model/AvailabilityModel")
const mongoose = require("mongoose")

// Khalti Payment initiation
exports.initiateKhaltiPayment = async (req, res) => {
  try {
    const { orderId, amount, bookingId } = req.body

    if (!orderId || !amount) {
      return res.status(400).json({ message: "Please provide orderId and amount" })
    }

    // Store the booking ID if provided to update after payment verification
    if (bookingId) {
      // You could store this in a session or temporary storage
      // For simplicity, we'll add it to the return_url as a query param
      req.session = req.session || {}
      req.session.pendingBookingId = bookingId
    }

    const data = {
      return_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/success?bookingId=${bookingId}&amount=${amount}`,
      website_url: process.env.WEBSITE_URL || "http://localhost:3000/",
      purchase_order_id: orderId,
      purchase_order_name: "Workout Session Payment",
      amount: amount * 100, // Khalti expects amount in paisa
    }

    const response = await axios.post("https://a.khalti.com/api/v2/epayment/initiate/", data, {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY || "25f7e11487c44a5f97d167d1ddb86c2c"}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Khalti payment initiated:", response.data)
    res.json({
      success: true,
      payment_url: response.data.payment_url,
      pidx: response.data.pidx,
    })
  } catch (error) {
    console.error("Khalti Payment Error:", error?.response?.data || error.message)
    res.status(500).json({
      success: false,
      message: "Payment initiation failed",
      error: error?.response?.data || error.message,
    })
  }
}

// Verify Khalti payment
exports.verifyPidx = async (req, res) => {
  try {
    const { pidx, bookingId, amount } = req.query

    if (!pidx) {
      return res.status(400).json({ message: "Payment ID (pidx) is required" })
    }

    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY || "25f7e11487c44a5f97d167d1ddb86c2c"}`,
        },
      },
    )

    console.log("Khalti verification response:", response.data)

    // If payment is completed, update the booking
    if (response.data.status === "Completed") {
      const bookingToUpdate = bookingId || req.session?.pendingBookingId

      // Get the payment amount from the response or from the query parameter
      const paymentAmount = response.data.total_amount
        ? response.data.total_amount / 100 // Convert from paisa to NPR if from Khalti response
        : amount || 0 // Use amount from query param as fallback

      if (bookingToUpdate) {
        const updatedBooking = await WorkoutSchedule.findOneAndUpdate(
          { bookingNumber: bookingToUpdate },
          {
            paymentStatus: "paid",
            isClientVerified: true,
            // IMPORTANT: Set the amount field to the payment amount
            amount: paymentAmount,
            // Store transaction details for reference
            $set: {
              "paymentDetails.transactionId": response.data.transaction_id,
              "paymentDetails.paidAt": new Date(),
              "paymentDetails.method": "Khalti",
              "paymentDetails.amount": paymentAmount,
            },
          },
          { new: true },
        )

        console.log("Updated booking after payment:", updatedBooking)
      }
    }

    res.json({
      success: true,
      status: response.data.status,
      data: response.data,
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error?.response?.data || error.message,
    })
  }
}

// Get payment statistics for dashboard
exports.getPaymentStats = async (req, res) => {
  try {
    // Get date range filter
    const { period = "year" } = req.query
    const currentDate = new Date()
    let startDate

    switch (period) {
      case "month":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        break
      case "quarter":
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1)
        break
      case "year":
      default:
        startDate = new Date(currentDate.getFullYear(), 0, 1)
        break
    }

    // Get total revenue
    const totalRevenue = await WorkoutSchedule.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    // Get pending amount
    const pendingAmount = await WorkoutSchedule.aggregate([
      { $match: { paymentStatus: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    // Get completed payments count
    const completedPayments = await WorkoutSchedule.countDocuments({ paymentStatus: "paid" })

    // Get refunded/failed amount
    const refundedAmount = await WorkoutSchedule.aggregate([
      { $match: { paymentStatus: "failed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])

    // Get payment methods distribution
    const paymentsByMethod = await WorkoutSchedule.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: "$paymentDetails.method",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          method: { $ifNull: ["$_id", "Other"] },
          count: 1,
          amount: 1,
          _id: 0,
        },
      },
    ])

    // Create default monthly data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const defaultMonthlyData = months.map((month) => ({ month, amount: 0 }))

    // Get revenue by month for current year
    const currentYear = new Date().getFullYear()
    const revenueByMonth = await WorkoutSchedule.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          startDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDate" },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInString: months,
              },
              in: { $arrayElemAt: ["$$monthsInString", { $subtract: ["$_id", 1] }] },
            },
          },
          amount: 1,
          _id: 0,
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Merge with default data to ensure all months are present
    const monthlyData = [...defaultMonthlyData]
    revenueByMonth.forEach((item) => {
      const index = months.indexOf(item.month)
      if (index !== -1) {
        monthlyData[index] = item
      }
    })

    // Calculate revenue growth (comparing current month to previous month)
    const currentMonth = currentDate.getMonth()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1

    const currentMonthRevenue = monthlyData[currentMonth].amount
    const previousMonthRevenue = monthlyData[previousMonth].amount

    let revenueGrowth = 0
    if (previousMonthRevenue > 0) {
      revenueGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    }

    // Get recent transactions for the dashboard
    const recentTransactions = await WorkoutSchedule.find({ paymentStatus: { $ne: null } })
      .sort({ startDate: -1 })
      .limit(5)
      .populate("clientId", "name")
      .lean()

    const formattedRecentTransactions = recentTransactions.map((transaction) => ({
      id: `PAY-${transaction._id.toString().substring(0, 6)}`,
      clientName: transaction.clientId?.name || "Unknown Client",
      date: transaction.startDate,
      amount: transaction.amount || 0,
      status: transaction.paymentStatus || "pending",
      method: transaction.paymentDetails?.method || "Credit Card",
      bookingId: transaction.bookingNumber || "N/A",
    }))

    res.json({
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      pendingAmount: pendingAmount.length > 0 ? pendingAmount[0].total : 0,
      completedPayments,
      refundedAmount: refundedAmount.length > 0 ? refundedAmount[0].total : 0,
      revenueGrowth: Number.parseFloat(revenueGrowth.toFixed(2)),
      paymentsByMethod:
        paymentsByMethod.length > 0
          ? paymentsByMethod
          : [
              { method: "Credit Card", count: 0, amount: 0 },
              { method: "Bank Transfer", count: 0, amount: 0 },
              { method: "Cash", count: 0, amount: 0 },
              { method: "Digital Wallet", count: 0, amount: 0 },
            ],
      revenueByMonth: monthlyData,
      recentTransactions: formattedRecentTransactions,
    })
  } catch (error) {
    console.error("Error fetching payment stats:", error)
    res.status(500).json({ message: "Failed to fetch payment statistics", error: error.message })
  }
}

// Get transactions with pagination and filtering
exports.getRecentTransactions = async (req, res) => {
  try {
    const {
      limit = 10,
      status = "all",
      method = "all",
      search = "",
      page = 1,
      perPage = 10,
      startDate,
      endDate,
    } = req.query

    const query = {}

    // Filter by status if provided
    if (status && status !== "all") {
      query.paymentStatus = status
    }

    // Filter by payment method if provided
    if (method && method !== "all") {
      query["paymentDetails.method"] = method
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    // Search functionality
    if (search) {
      // Create a regex search pattern
      const searchRegex = new RegExp(search, "i")

      query.$or = [
        { bookingNumber: searchRegex },
        // Add more fields to search if needed
      ]

      // If the search term might be a client name, we need a different approach
      // This requires populating the client and then filtering in memory
      // For better performance, consider adding a clientName field to the WorkoutSchedule model
    }

    // For recent transactions without pagination
    if (limit && !page) {
      const recentTransactions = await WorkoutSchedule.find(query)
        .sort({ startDate: -1 })
        .limit(Number.parseInt(limit))
        .populate("clientId", "name")
        .lean()

      const formattedTransactions = recentTransactions.map((transaction) => ({
        id: `PAY-${transaction._id.toString().substring(0, 6)}`,
        clientName: transaction.clientId?.name || "Unknown Client",
        date: transaction.startDate,
        amount: transaction.amount || 0,
        status: transaction.paymentStatus || "pending",
        method: transaction.paymentDetails?.method || "Credit Card",
        bookingId: transaction.bookingNumber || "N/A",
      }))

      return res.json(formattedTransactions)
    }

    // For paginated transactions
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(perPage)

    const [transactions, totalCount] = await Promise.all([
      WorkoutSchedule.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(Number.parseInt(perPage))
        .populate("clientId", "name")
        .lean(),
      WorkoutSchedule.countDocuments(query),
    ])

    const formattedTransactions = transactions.map((transaction) => ({
      id: `PAY-${transaction._id.toString().substring(0, 6)}`,
      clientName: transaction.clientId?.name || "Unknown Client",
      date: transaction.startDate,
      amount: transaction.amount || 0,
      status: transaction.paymentStatus || "pending",
      method: transaction.paymentDetails?.method || "Credit Card",
      bookingId: transaction.bookingNumber || "N/A",
    }))

    res.json({
      transactions: formattedTransactions,
      pagination: {
        total: totalCount,
        page: Number.parseInt(page),
        perPage: Number.parseInt(perPage),
        totalPages: Math.ceil(totalCount / Number.parseInt(perPage)),
      },
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    res.status(500).json({ message: "Failed to fetch transactions", error: error.message })
  }
}

// Export payment data to CSV/Excel
exports.exportPaymentData = async (req, res) => {
  try {
    const { format = "csv", startDate, endDate, status } = req.query

    // Build query based on filters
    const query = {}

    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    if (status && status !== "all") {
      query.paymentStatus = status
    }

    // Get payment data
    const payments = await WorkoutSchedule.find(query)
      .sort({ startDate: -1 })
      .populate("clientId", "name email")
      .populate("trainerId", "name")
      .lean()

    // Format data for export
    const formattedData = payments.map((payment) => ({
      "Booking Number": payment.bookingNumber || "N/A",
      "Client Name": payment.clientId?.name || "Unknown",
      "Client Email": payment.clientId?.email || "N/A",
      "Trainer Name": payment.trainerId?.name || "Unknown",
      Date: payment.startDate ? new Date(payment.startDate).toLocaleDateString() : "N/A",
      Time: payment.startTime || "N/A",
      "Duration (mins)": payment.duration || 0,
      Amount: payment.amount || 0,
      Status: payment.paymentStatus || "pending",
      "Payment Method": payment.paymentDetails?.method || "N/A",
      "Transaction ID": payment.paymentDetails?.transactionId || "N/A",
    }))

    // CSV implementation
    if (format === "csv") {
      // Convert JSON to CSV
      const csvRows = []

      // Add header row
      const headers = Object.keys(formattedData[0] || {})
      csvRows.push(headers.join(","))

      // Add data rows
      for (const row of formattedData) {
        const values = headers.map((header) => {
          const value = row[header] || ""
          // Escape commas and quotes in values
          const escaped = String(value).replace(/"/g, '""')
          return `"${escaped}"`
        })
        csvRows.push(values.join(","))
      }

      const csvString = csvRows.join("\n")

      // Set headers for file download
      res.setHeader("Content-Type", "text/csv")
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=payment_data_${new Date().toISOString().split("T")[0]}.csv`,
      )

      // Send CSV data
      return res.send(csvString)
    }

    // For other formats (e.g., JSON)
    res.json({
      success: true,
      data: formattedData,
    })
  } catch (error) {
    console.error("Error exporting payment data:", error)
    res.status(500).json({ message: "Failed to export payment data", error: error.message })
  }
}

// Update payment status (for manual updates or refunds)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params
    const { status, notes, amount } = req.body

    if (!bookingId || !status) {
      return res.status(400).json({ message: "Booking ID and status are required" })
    }

    // Validate status
    const validStatuses = ["pending", "paid", "failed"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be one of: pending, paid, failed" })
    }

    // Get the current booking to preserve the amount if not provided
    const currentBooking = await WorkoutSchedule.findOne({ bookingNumber: bookingId })

    if (!currentBooking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    // Update the payment status
    const updatedBooking = await WorkoutSchedule.findOneAndUpdate(
      { bookingNumber: bookingId },
      {
        paymentStatus: status,
        // Use provided amount or keep the existing amount if not provided
        ...(amount !== undefined ? { amount } : {}),
        ...(notes && { "paymentDetails.notes": notes }),
        ...(status === "paid" && {
          isClientVerified: true,
          "paymentDetails.paidAt": new Date(),
          "paymentDetails.method": "Manual Update",
          // Also update the amount in payment details if provided
          ...(amount !== undefined ? { "paymentDetails.amount": amount } : {}),
        }),
      },
      { new: true },
    )

    res.json({
      success: true,
      message: `Payment status updated to ${status}`,
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Error updating payment status:", error)
    res.status(500).json({ message: "Failed to update payment status", error: error.message })
  }
}

// NEW: Process direct payment
exports.processDirectPayment = async (req, res) => {
  try {
    const { bookingId } = req.params
    const { amount, notes = "Direct payment from client portal" } = req.body

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" })
    }

    // Get the current booking
    const currentBooking = await WorkoutSchedule.findOne({ bookingNumber: bookingId })

    if (!currentBooking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    // Use the provided amount or the booking's existing amount
    const paymentAmount = amount || currentBooking.amount

    if (!paymentAmount) {
      return res.status(400).json({ message: "Payment amount is required" })
    }

    // Generate a transaction ID
    const transactionId = `DIR-${Date.now()}-${Math.floor(Math.random() * 10000)}`

    // Update the payment status to paid
    const updatedBooking = await WorkoutSchedule.findOneAndUpdate(
      { bookingNumber: bookingId },
      {
        paymentStatus: "paid",
        isClientVerified: true,
        // Set the amount field
        amount: paymentAmount,
        // Store transaction details
        $set: {
          "paymentDetails.transactionId": transactionId,
          "paymentDetails.paidAt": new Date(),
          "paymentDetails.method": "Direct Payment",
          "paymentDetails.amount": paymentAmount,
          "paymentDetails.notes": notes,
        },
      },
      { new: true },
    )

    res.json({
      success: true,
      message: "Payment processed successfully",
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Error processing direct payment:", error)
    res.status(500).json({ message: "Failed to process payment", error: error.message })
  }
}