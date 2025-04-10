"use client"

import { useEffect } from "react"
import { CheckCircle, AlertCircle, X } from "lucide-react"

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 z-50 animate-fadeIn">
      <div
        className={`flex items-center p-4 rounded-lg shadow-lg ${
          type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="flex-shrink-0 mr-3">
          {type === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="mr-2">
          <p className={`text-sm font-medium ${type === "success" ? "text-green-800" : "text-red-800"}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 ${
            type === "success" ? "text-green-500 hover:bg-green-100" : "text-red-500 hover:bg-red-100"
          }`}
        >
          <span className="sr-only">Close</span>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast

