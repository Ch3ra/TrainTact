"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Search,
  Filter,
  Eye,
  Download,
  CreditCard,
  DollarSign,
  BarChart2,
  PieChart,
  ArrowUpRight,
  CheckCircle,
  Clock,
  RefreshCw,
  List,
  LayoutDashboard,
  Receipt,
  ChevronRight,
  ChevronLeft,
  X,
  Edit,
  Save,
} from "lucide-react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
} from "chart.js"
import { Pie, Bar } from "react-chartjs-2"
import AdminLayout from "./AdminSidebar"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title)

// API base URL - adjust this to match your server
const API_BASE_URL =
  typeof window !== "undefined"
    ? window.ENV?.REACT_APP_API_BASE_URL || "http://localhost:3000/api"
    : "http://localhost:3000/api"

export default function PaymentDashboard() {
  const [viewMode, setViewMode] = useState("dashboard") // "dashboard" or "transactions"
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterMethod, setFilterMethod] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("year")
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  const [editingClientName, setEditingClientName] = useState(false)
  const [newClientName, setNewClientName] = useState("")

  // State for API data
  const [paymentStats, setPaymentStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    completedPayments: 0,
    refundedAmount: 0,
    revenueGrowth: 0,
    paymentsByMethod: [],
    revenueByMonth: [],
    recentTransactions: [],
  })
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch dashboard stats
  useEffect(() => {
    const fetchPaymentStats = async () => {
      try {
        setLoading(true)
        console.log("Fetching payment stats...")
        const response = await axios.get(`${API_BASE_URL}/payment/stats?period=${dateRange}`)
        console.log("Payment stats response:", response.data)

        // Ensure we have valid data structure
        const data = response.data || {}

        // Process transactions to ensure client names are displayed correctly
        let recentTransactions = []
        if (Array.isArray(data.recentTransactions)) {
          recentTransactions = data.recentTransactions.map((transaction) => {
            // If the transaction has a clientId with userName, use it
            if (transaction.clientId && transaction.clientId.userName) {
              return {
                ...transaction,
                clientName: transaction.clientId.userName,
              }
            }
            return transaction
          })
        }

        setPaymentStats({
          totalRevenue: data.totalRevenue || 0,
          pendingAmount: data.pendingAmount || 0,
          completedPayments: data.completedPayments || 0,
          refundedAmount: data.refundedAmount || 0,
          revenueGrowth: data.revenueGrowth || 0,
          paymentsByMethod: Array.isArray(data.paymentsByMethod) ? data.paymentsByMethod : [],
          revenueByMonth: Array.isArray(data.revenueByMonth) ? data.revenueByMonth : [],
          recentTransactions: recentTransactions,
        })
        setLoading(false)
      } catch (err) {
        console.error("Error fetching payment stats:", err)
        setError("Failed to load payment statistics")
        setLoading(false)

        // Set default empty arrays to prevent mapping errors
        setPaymentStats((prev) => ({
          ...prev,
          paymentsByMethod: [],
          revenueByMonth: [],
          recentTransactions: [],
        }))
      }
    }

    fetchPaymentStats()
  }, [dateRange])

  // Fetch transactions with filters
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        console.log("Fetching transactions...")

        const params = {
          page: currentPage,
          perPage,
          status: filterStatus !== "all" ? filterStatus : undefined,
          method: filterMethod !== "all" ? filterMethod : undefined,
          search: searchQuery || undefined,
        }

        const response = await axios.get(`${API_BASE_URL}/payment/transactions`, { params })
        console.log("Transactions response:", response.data)

        let processedTransactions = []

        // Handle different response formats
        if (response.data && response.data.transactions) {
          // If response has transactions property (paginated response)
          processedTransactions = Array.isArray(response.data.transactions) ? response.data.transactions : []
          setPagination(
            response.data.pagination || {
              total: 0,
              page: 1,
              perPage: 10,
              totalPages: 1,
            },
          )
        } else if (Array.isArray(response.data)) {
          // If response is directly an array
          processedTransactions = response.data
          // Calculate pagination based on array length
          setPagination({
            total: response.data.length,
            page: 1,
            perPage: response.data.length,
            totalPages: 1,
          })
        } else {
          // Fallback to empty array if response format is unexpected
          processedTransactions = []
          setPagination({
            total: 0,
            page: 1,
            perPage: 10,
            totalPages: 1,
          })
        }

        // Process transactions to ensure client names are displayed correctly
        processedTransactions = processedTransactions.map((transaction) => {
          // If the transaction has a clientId with userName, use it
          if (transaction.clientId && transaction.clientId.userName) {
            return {
              ...transaction,
              clientName: transaction.clientId.userName,
            }
          }
          return transaction
        })

        setTransactions(processedTransactions)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError("Failed to load transactions")
        setLoading(false)
        setTransactions([]) // Set empty array to prevent mapping errors
      }
    }

    if (viewMode === "transactions") {
      fetchTransactions()
    }
  }, [viewMode, currentPage, perPage, filterStatus, filterMethod, searchQuery])

  // Format currency
  const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toFixed(2)}`
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Get client name - improved to handle "Unknown Client" value
  const getClientName = (transaction) => {
    // If the transaction has a clientId with userName, use it
    if (transaction.clientId && transaction.clientId.userName) {
      return transaction.clientId.userName
    }

    // If we have a clientName that's not "Unknown Client", use it
    if (transaction.clientName && transaction.clientName !== "Unknown Client") {
      return transaction.clientName
    }

    // Try to get the client name from various possible locations
    if (transaction.user && transaction.user.userName) {
      return transaction.user.userName
    }

    if (transaction.user && transaction.user.name) {
      return transaction.user.name
    }

    if (transaction.user && transaction.user.firstName && transaction.user.lastName) {
      return `${transaction.user.firstName} ${transaction.user.lastName}`
    }

    if (transaction.client && typeof transaction.client === "object") {
      if (transaction.client.userName) {
        return transaction.client.userName
      }
      if (transaction.client.name) {
        return transaction.client.name
      }
      if (transaction.client.firstName && transaction.client.lastName) {
        return `${transaction.client.firstName} ${transaction.client.lastName}`
      }
      // If client has a user reference, try to get userName from there
      if (transaction.client.user && typeof transaction.client.user === "object") {
        if (transaction.client.user.userName) {
          return transaction.client.user.userName
        }
      }
    }

    if (transaction.userName) {
      return transaction.userName
    }

    if (transaction.client && typeof transaction.client === "string" && transaction.client !== "Unknown Client") {
      return transaction.client
    }

    // If we have a client ID or user ID, use a formatted version
    if (transaction.userId) {
      return `Client #${transaction.userId}`
    }

    if (transaction.clientId && typeof transaction.clientId === "string") {
      return `Client #${transaction.clientId}`
    }

    // If we have a booking ID, use that as a last resort
    if (transaction.bookingId) {
      return `Client for ${transaction.bookingId}`
    }

    return "Client" // Default value
  }

  // Handle saving client name
  const handleSaveClientName = async () => {
    if (!selectedTransaction || !newClientName.trim()) return

    try {
      // In a real app, you would update the client name in your backend
      // For now, we'll just update it in our local state
      console.log(`Updating client name for transaction ${selectedTransaction.id} to ${newClientName}`)

      // Update the selected transaction
      const updatedTransaction = {
        ...selectedTransaction,
        clientName: newClientName,
      }

      setSelectedTransaction(updatedTransaction)

      // Update the transaction in the transactions list
      if (viewMode === "transactions") {
        setTransactions(transactions.map((t) => (t.id === selectedTransaction.id ? updatedTransaction : t)))
      } else {
        // Update in recent transactions
        setPaymentStats((prev) => ({
          ...prev,
          recentTransactions: prev.recentTransactions.map((t) =>
            t.id === selectedTransaction.id ? updatedTransaction : t,
          ),
        }))
      }

      setEditingClientName(false)

      // In a real app, you would make an API call like this:
      // await axios.put(`${API_BASE_URL}/clients/${selectedTransaction.clientId}`, {
      //   name: newClientName
      // });
    } catch (err) {
      console.error("Error updating client name:", err)
      alert("Failed to update client name")
    }
  }

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
      case "refunded":
        return <RefreshCw className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  // Get payment method icon
  const getPaymentMethodIcon = () => {
    // Always return Khalti icon
    return <CreditCard className="h-4 w-4" />
  }

  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return
    setCurrentPage(page)
  }

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true)

      const params = {
        format: "csv",
        status: filterStatus !== "all" ? filterStatus : undefined,
        startDate: undefined, // Add date picker if needed
        endDate: undefined, // Add date picker if needed
      }

      // Use responseType: 'blob' to handle file downloads
      const response = await axios.get(`${API_BASE_URL}/payment/export`, {
        params,
        responseType: "blob", // Important for file downloads
      })

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `payment_data_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setLoading(false)
    } catch (err) {
      console.error("Error exporting data:", err)
      alert("Failed to export data")
      setLoading(false)
    }
  }

  // Handle payment status update
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/payment/status/${bookingId}`, {
        status: newStatus,
      })

      // Refresh data after update
      if (viewMode === "dashboard") {
        const statsResponse = await axios.get(`${API_BASE_URL}/payment/stats?period=${dateRange}`)

        // Ensure we have valid data structure
        const data = statsResponse.data || {}

        // Process transactions to ensure client names are displayed correctly
        let recentTransactions = []
        if (Array.isArray(data.recentTransactions)) {
          recentTransactions = data.recentTransactions.map((transaction) => {
            // If the transaction has a clientId with userName, use it
            if (transaction.clientId && transaction.clientId.userName) {
              return {
                ...transaction,
                clientName: transaction.clientId.userName,
              }
            }
            return transaction
          })
        }

        setPaymentStats({
          totalRevenue: data.totalRevenue || 0,
          pendingAmount: data.pendingAmount || 0,
          completedPayments: data.completedPayments || 0,
          refundedAmount: data.refundedAmount || 0,
          revenueGrowth: data.revenueGrowth || 0,
          paymentsByMethod: Array.isArray(data.paymentsByMethod) ? data.paymentsByMethod : [],
          revenueByMonth: Array.isArray(data.revenueByMonth) ? data.revenueByMonth : [],
          recentTransactions: recentTransactions,
        })
      } else {
        const transactionsResponse = await axios.get(`${API_BASE_URL}/payment/transactions`, {
          params: {
            page: currentPage,
            perPage,
            status: filterStatus !== "all" ? filterStatus : undefined,
            method: filterMethod !== "all" ? filterMethod : undefined,
            search: searchQuery || undefined,
          },
        })

        let processedTransactions = []

        if (transactionsResponse.data && transactionsResponse.data.transactions) {
          processedTransactions = Array.isArray(transactionsResponse.data.transactions)
            ? transactionsResponse.data.transactions
            : []
          setPagination(
            transactionsResponse.data.pagination || {
              total: 0,
              page: 1,
              perPage: 10,
              totalPages: 1,
            },
          )
        } else if (Array.isArray(transactionsResponse.data)) {
          processedTransactions = transactionsResponse.data
        } else {
          processedTransactions = []
        }

        // Process transactions to ensure client names are displayed correctly
        processedTransactions = processedTransactions.map((transaction) => {
          // If the transaction has a clientId with userName, use it
          if (transaction.clientId && transaction.clientId.userName) {
            return {
              ...transaction,
              clientName: transaction.clientId.userName,
            }
          }
          return transaction
        })

        setTransactions(processedTransactions)
      }

      alert(`Payment status updated to ${newStatus}`)
    } catch (err) {
      console.error("Error updating payment status:", err)
      alert("Failed to update payment status")
    }
  }

  // Handle view transaction details
  const handleViewTransaction = (transaction) => {
    // Get the client name if it's not already set or is "Unknown Client"
    if (!transaction.clientName || transaction.clientName === "Unknown Client") {
      transaction = {
        ...transaction,
        clientName: getClientName(transaction),
      }
    }

    setSelectedTransaction(transaction)
    setNewClientName(transaction.clientName || "Client")
    setShowTransactionDetails(true)
  }

  // Data for payment method pie chart
  const paymentMethodData = {
    labels: Array.isArray(paymentStats.paymentsByMethod)
      ? paymentStats.paymentsByMethod.map((item) => item.method)
      : [],
    datasets: [
      {
        data: Array.isArray(paymentStats.paymentsByMethod)
          ? paymentStats.paymentsByMethod.map((item) => item.amount)
          : [],
        backgroundColor: ["#4ade80", "#60a5fa", "#f87171", "#facc15"],
        borderWidth: 1,
      },
    ],
  }

  // Data for revenue by month bar chart
  const revenueByMonthData = {
    labels: Array.isArray(paymentStats.revenueByMonth) ? paymentStats.revenueByMonth.map((item) => item.month) : [],
    datasets: [
      {
        label: "Revenue",
        data: Array.isArray(paymentStats.revenueByMonth) ? paymentStats.revenueByMonth.map((item) => item.amount) : [],
        backgroundColor: "#CE0000",
        borderColor: "#A00000",
        borderWidth: 1,
        barThickness: 30,
        maxBarThickness: 40,
      },
    ],
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 10,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        displayColors: false,
        callbacks: {
          label: (context) => `${context.dataset.label || context.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: (value) => `$${value}`,
          font: {
            size: 11,
          },
        },
      },
    },
  }

  // Loading state
  if (loading && !paymentStats.totalRevenue && !transactions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CE0000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !paymentStats.totalRevenue && !transactions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#CE0000] text-white rounded-md hover:bg-[#A00000]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Page Header with View Toggle */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payment Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage and track all payment transactions</p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setViewMode("dashboard")}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              viewMode === "dashboard" ? "bg-[#CE0000] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Dashboard
          </button>
          <button
            onClick={() => setViewMode("transactions")}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              viewMode === "transactions" ? "bg-[#CE0000] text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <List className="h-4 w-4 mr-1" />
            Transactions
          </button>
        </div>
      </div>

      {viewMode === "dashboard" ? (
        /* Dashboard View */
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(paymentStats.totalRevenue || 0)}</h3>
                  <div className="flex items-center mt-1 text-xs font-medium text-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>{paymentStats.revenueGrowth || 0}% from last month</span>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Amount</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {formatCurrency(paymentStats.pendingAmount || 0)}
                  </h3>
                  <div className="flex items-center mt-1 text-xs font-medium text-yellow-600">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Awaiting processing</span>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed Payments</p>
                  <h3 className="text-2xl font-bold text-gray-900">{paymentStats.completedPayments || 0}</h3>
                  <div className="flex items-center mt-1 text-xs font-medium text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span>Successfully processed</span>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Refunded Amount</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {formatCurrency(paymentStats.refundedAmount || 0)}
                  </h3>
                  <div className="flex items-center mt-1 text-xs font-medium text-red-600">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    <span>Returned to clients</span>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-red-100 text-red-600">
                  <RefreshCw className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Payment Methods Pie Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
              <div className="h-64">
                {Array.isArray(paymentStats.paymentsByMethod) && paymentStats.paymentsByMethod.length > 0 ? (
                  <Pie
                    data={paymentMethodData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: (context) => `${context.label}: ${formatCurrency(context.raw)}`,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No payment method data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue by Month Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                <div className="flex items-center">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="text-sm border-gray-300 rounded-md focus:ring-[#CE0000] focus:border-[#CE0000] mr-2"
                  >
                    <option value="year">This Year</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="month">Last Month</option>
                  </select>
                  <BarChart2 className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="h-64">
                {Array.isArray(paymentStats.revenueByMonth) && paymentStats.revenueByMonth.length > 0 ? (
                  <Bar
                    data={revenueByMonthData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No revenue data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <button
                onClick={() => setViewMode("transactions")}
                className="text-[#CE0000] hover:text-[#A00000] text-sm font-medium flex items-center"
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(paymentStats.recentTransactions) && paymentStats.recentTransactions.length > 0 ? (
                    paymentStats.recentTransactions.map((transaction) => (
                      <tr key={transaction.id || Math.random().toString()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.id || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getClientName(transaction)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4" />
                            <span className="ml-2">Khalti</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                              transaction.status,
                            )}`}
                          >
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1">
                              {transaction.status
                                ? transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)
                                : "Unknown"}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewTransaction(transaction)}
                            className="text-[#CE0000] hover:text-[#A00000] transition-colors duration-200"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center py-6">
                          <Receipt className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-lg font-medium">No recent transactions</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Transactions View */
        <>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none w-full sm:w-64"
                  />
                </div>

                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none appearance-none bg-white w-full"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="relative w-full sm:w-auto">
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="pl-4 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#CE0000] focus:border-[#CE0000] focus:outline-none appearance-none bg-white w-full"
                  >
                    <option value="all">All Payment Methods</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Khalti">Khalti</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <button
                  onClick={handleExport}
                  className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(transactions) && transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr key={transaction.id || Math.random().toString()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.id || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getClientName(transaction)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4" />
                            <span className="ml-2">Khalti</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                              transaction.status,
                            )}`}
                          >
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1">
                              {transaction.status
                                ? transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)
                                : "Unknown"}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a href="#" className="text-[#CE0000] hover:underline">
                            {transaction.bookingId || "N/A"}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewTransaction(transaction)}
                              className="text-[#CE0000] hover:text-[#A00000] transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {transaction.status === "pending" && (
                              <button
                                onClick={() => handleUpdateStatus(transaction.bookingId, "paid")}
                                className="text-green-500 hover:text-green-700 transition-colors duration-200"
                                title="Mark as Paid"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center py-6">
                          <Receipt className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-lg font-medium">No transactions found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {Array.isArray(transactions) && transactions.length > 0 && (
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === pagination.totalPages
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
                      Showing <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(currentPage * perPage, pagination.total)}</span> of{" "}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        // Logic to show pages around current page
                        let pageNum
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border ${
                              currentPage === pageNum
                                ? "z-10 bg-[#CE0000] text-white border-[#CE0000]"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            } text-sm font-medium`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 ${
                          currentPage === pagination.totalPages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              <button
                onClick={() => setShowTransactionDetails(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedTransaction.id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedTransaction.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  {editingClientName ? (
                    <div className="flex items-center mt-1">
                      <input
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="text-sm border-gray-300 rounded-md focus:ring-[#CE0000] focus:border-[#CE0000] w-full"
                      />
                      <button
                        onClick={handleSaveClientName}
                        className="ml-2 text-green-600 hover:text-green-700"
                        title="Save"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingClientName(false)
                          setNewClientName(selectedTransaction.clientName || "Client")
                        }}
                        className="ml-1 text-gray-600 hover:text-gray-700"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedTransaction.clientName || "Client"}
                      </p>
                      <button
                        onClick={() => setEditingClientName(true)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        title="Edit Client Name"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Method</p>
                  <div className="flex items-center mt-1">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-semibold text-gray-900 ml-2">Khalti</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(selectedTransaction.status)}
                    <p
                      className={`text-sm font-semibold ml-2 ${
                        selectedTransaction.status === "paid" || selectedTransaction.status === "completed"
                          ? "text-green-600"
                          : selectedTransaction.status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {selectedTransaction.status
                        ? selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)
                        : "Unknown"}
                    </p>
                  </div>
                </div>
                {selectedTransaction.bookingId && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Booking ID</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedTransaction.bookingId}</p>
                  </div>
                )}
                {selectedTransaction.clientEmail && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Client Email</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedTransaction.clientEmail}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                <p className="text-sm text-gray-700">
                  {selectedTransaction.description ||
                    `Payment for booking #${selectedTransaction.bookingId || "N/A"} via Khalti payment gateway. 
                   Transaction processed on ${formatDate(selectedTransaction.date)}.`}
                </p>
              </div>

              {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">Items</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTransaction.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6 space-x-3">
                {selectedTransaction.status === "pending" && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedTransaction.bookingId, "paid")
                      setShowTransactionDetails(false)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

