import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex space-x-1">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md border border-slate-300 py-2 px-3 text-center text-sm transition-all shadow-sm hover:shadow-lg text-slate-600 hover:text-white hover:bg-red-700 hover:border-red-700 focus:text-white focus:bg-red-700 focus:border-red-700 active:border-red-700 active:text-white active:bg-red-700 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
      >
        Prev
      </button>
      {/* Page Number Buttons */}
      {[...Array(totalPages).keys()].map(index => (
        <button
          key={index + 1}
          onClick={() => onPageChange(index + 1)}
          className={`min-w-9 rounded-md py-2 px-3 text-center text-sm transition-all shadow-sm ml-2 ${
            currentPage === index + 1
              ? 'bg-red-700 text-white border-transparent' // Styles for the active page
              : 'border border-slate-300 text-slate-600 hover:text-white hover:bg-red-700 hover:border-red-700 focus:text-white focus:bg-red-700 focus:border-red-700 active:border-red-700 active:text-white active:bg-red-700' // Styles for other pages on hover and focus
          }`}
        >
          {index + 1}
        </button>
      ))}
      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-md border border-slate-300 py-2 px-3 text-center text-sm transition-all shadow-sm hover:shadow-lg text-slate-600 hover:text-white hover:bg-red-700 hover:border-red-700 focus:text-white focus:bg-red-700 focus:border-red-500 active:border-red-700 active:text-white active:bg-red-700 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
