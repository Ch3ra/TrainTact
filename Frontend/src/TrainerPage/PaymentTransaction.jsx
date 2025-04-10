"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, Check, Search, ChevronLeft, ChevronRight, DollarSign, Calendar, Clock } from "lucide-react"
import axios from "axios"

import { toast } from "react-hot-toast" // Import toast if you're using react-hot-toast
import TrainerLayout from "./TrainerLayout"

const PaymentTransactions = () => {
  const [userId, setUserId] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })
  const [processingPayment, setProcessingPayment] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Authentication check
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("No token found")
        setError("Authentication required. Please log in.")
        setLoading(false)
        navigate("/authentication")
        return false
      }

      try {
        // Decode token to check role
        const decodedToken = JSON.parse(atob(token.split(".")[1]))
        console.log("Decoded token:", decodedToken)

        // Check if user is a trainer
        const userRole =
          decodedToken.role ||
          decodedToken.userRole ||
          decodedToken.userType ||
          decodedToken.type ||
          decodedToken.accountType

        if (userRole && userRole.toLowerCase() !== "trainer") {
          console.log("Access denied: User is not a trainer")
          setError("Access denied. Only trainers can view payment transactions.")
          setLoading(false)
          navigate("/authentication")
          return false
        }

        // User is a trainer, set userId and continue
        setUserId(decodedToken.id)
        return true
      } catch (error) {
        console.error("Failed to decode token", error)
        setError("Authentication error. Please log in again.")
        setLoading(false)
        navigate("/authentication")
        return false
      }
    }

    // Run auth check and fetch transactions if authorized
    if (checkAuth()) {
      const token = localStorage.getItem("token")
      const decodedToken = JSON.parse(atob(token.split(".")[1]))
      fetchTransactions(decodedToken.id)
    }
  }, [statusFilter, pagination.page, navigate])

  // Fetch transactions
  const fetchTransactions = async (trainerId) => {
    setLoading(true)
    try {
      const response = await axios.get(
        `http://localhost:3000/api/trainer-dashboard/${trainerId}/payment-transactions`,
        {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            status: statusFilter || undefined,
          },
        },
      )

      if (response.data.success) {
        setTransactions(response.data.data.transactions)
        setPagination(response.data.data.pagination)
        console.log("Fetched transactions:", response.data.data.transactions)
      } else {
        setError(response.data.message)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error.response?.data || error.message)
      setError(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch transaction details
  const fetchTransactionDetails = async (transactionId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer-dashboard/transaction/${transactionId}`)

      if (response.data.success) {
        setSelectedTransaction(response.data.data)
        setShowDetailsModal(true)
      } else {
        console.error("Error fetching transaction details:", response.data.message)
        toast?.error("Failed to fetch transaction details")
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error.response?.data || error.message)
      toast?.error("Failed to fetch transaction details")
    }
  }

  // Update payment status
  const updatePaymentStatus = async (transactionId) => {
    setProcessingPayment(true)
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/trainer-dashboard/update-payment-status/${transactionId}`,
      )

      if (response.data.success) {
        // Update the transaction in the list
        setTransactions(
          transactions.map((transaction) =>
            transaction.transactionId === transactionId ? { ...transaction, paymentStatus: "paid" } : transaction,
          ),
        )

        // Update the selected transaction if details modal is open
        if (selectedTransaction && selectedTransaction.transactionId === transactionId) {
          setSelectedTransaction({
            ...selectedTransaction,
            payment: { ...selectedTransaction.payment, status: "paid" },
          })
        }

        // Show success message
        toast?.success("Payment status updated successfully")
      } else {
        console.error("Error updating payment status:", response.data.message)
        toast?.error("Failed to update payment status: " + response.data.message)
      }
    } catch (error) {
      console.error("Error updating payment status:", error.response?.data || error.message)
      toast?.error("Failed to update payment status: " + (error.response?.data?.message || error.message))
    } finally {
      setProcessingPayment(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage })
    }
  }

  // Filter by status
  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setPagination({ ...pagination, page: 1 }) // Reset to first page when filtering
  }

  // Search functionality
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/authentication")
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )

  if (error)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    )

  return (
    <TrainerLayout className="bg-gray-50 min-h-screen">
      <div />
      <div className="flex">
        {/* Sidebar */}

        {/* Main Content */}
        <div className="flex-1 p-8">
          <h3 className="text-2xl font-bold mb-6">Payment Transactions</h3>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 w-full">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by client or booking number"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-sm text-gray-500">Filter by status:</span>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-auto"
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Earnings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">Total</span>
              </div>
              <h3 className="text-gray-500 text-sm mb-1">Total Earnings</h3>
              <div className="text-2xl font-bold">
                {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-green-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">Received</span>
              </div>
              <h3 className="text-gray-500 text-sm mb-1">Paid Earnings</h3>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  transactions.filter((t) => t.paymentStatus === "paid").reduce((sum, t) => sum + t.amount, 0),
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-yellow-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-xs font-medium text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full">Pending</span>
              </div>
              <h3 className="text-gray-500 text-sm mb-1">Pending Earnings</h3>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  transactions.filter((t) => t.paymentStatus === "pending").reduce((sum, t) => sum + t.amount, 0),
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>Error: {error}</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-sm text-center">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DollarSign size={32} className="text-gray-400" />
                </div>
                <p className="text-lg text-gray-600">No payment transactions found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  When clients make payments for sessions, they will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.transactionId}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-start gap-4 mb-4 md:mb-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                        <img
                          src={transaction.clientPhoto || "/placeholder.svg?height=64&width=64"}
                          alt={transaction.clientName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold">{transaction.clientName}</h4>
                        <div className="flex items-center space-x-1 mt-1">
                          <DollarSign className="h-4 w-4 text-blue-500" />
                          <p className="text-gray-600 text-sm">{formatCurrency(transaction.amount)}</p>
                        </div>

                        {/* Transaction Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">{formatDate(transaction.date)}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">
                              {transaction.startTime} ({transaction.duration} min)
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : transaction.paymentStatus === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {transaction.paymentStatus.charAt(0).toUpperCase() + transaction.paymentStatus.slice(1)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Booking: {transaction.bookingNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => fetchTransactionDetails(transaction.transactionId)}
                        className="p-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {transaction.paymentStatus === "pending" && (
                        <button
                          onClick={() => updatePaymentStatus(transaction.transactionId)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                          disabled={processingPayment}
                        >
                          {processingPayment ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Check size={16} />
                          )}
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === pagination.pages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Page numbers */}
                    {[...Array(pagination.pages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === i + 1
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === pagination.pages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Transaction Details</h2>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Booking Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Booking Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Booking Number:</span>
                      <span className="font-medium">{selectedTransaction.bookingNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span>{formatDate(selectedTransaction.session.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span>{selectedTransaction.session.startTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span>{selectedTransaction.session.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`font-medium ${
                          selectedTransaction.session.status === "completed"
                            ? "text-green-600"
                            : selectedTransaction.session.status === "cancelled"
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {selectedTransaction.session.status.charAt(0).toUpperCase() +
                          selectedTransaction.session.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-bold">{formatCurrency(selectedTransaction.payment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span
                        className={`font-medium ${
                          selectedTransaction.payment.status === "paid"
                            ? "text-green-600"
                            : selectedTransaction.payment.status === "failed"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {selectedTransaction.payment.status.charAt(0).toUpperCase() +
                          selectedTransaction.payment.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span>{formatDate(selectedTransaction.payment.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Updated:</span>
                      <span>{formatDate(selectedTransaction.payment.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Client Information</h3>
                  <div className="flex items-center mb-4">
                    <img
                      src={selectedTransaction.client.photo || "/placeholder.svg?height=48&width=48"}
                      alt={selectedTransaction.client.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <div className="font-medium">{selectedTransaction.client.name}</div>
                      <div className="text-sm text-gray-500">{selectedTransaction.client.email}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age:</span>
                      <span>{selectedTransaction.client.age || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span>{selectedTransaction.client.location || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fitness Level:</span>
                      <span>{selectedTransaction.client.fitnessLevel || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 p-4 rounded-lg flex flex-col justify-between">
                  <h3 className="font-semibold text-gray-700 mb-3">Actions</h3>

                  {selectedTransaction.payment.status === "pending" ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-4">
                        This payment is currently pending. You can mark it as paid if you've received the payment
                        outside the platform.
                      </p>
                      <button
                        onClick={() => {
                          updatePaymentStatus(selectedTransaction.transactionId)
                          setShowDetailsModal(false)
                        }}
                        disabled={processingPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        {processingPayment ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Mark as Paid
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 italic">No actions available for this transaction</div>
                  )}
                </div>
              </div>

              {/* Session Notes */}
              {selectedTransaction.session.message && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Session Notes</h3>
                  <p className="text-gray-600">{selectedTransaction.session.message}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TrainerLayout>
  )
}

export default PaymentTransactions

