import React from "react";
import AdminNavbar from "./AdminNavbar";

const TrainerRequest = () => {
  return (
    <>
      <div>
        <AdminNavbar />
      </div>

      <div className="h-max bg-gray-200 pt-12">
        {/* Grid container for the cards */}
        <div className="grid grid-cols-3 gap-4 px-8 ml-10 mt-10">
          {/* Repeating Card Component */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg"
            >
              <div className="border-b px-4 pb-6">
                <div className="text-center my-4">
                  <img
                    className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-800 mx-auto my-4"
                    src="https://randomuser.me/api/portraits/women/21.jpg"
                    alt=""
                  />
                  <div className="py-2">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-1">
                      Cait Genevieve
                    </h3>
                    <div className="inline-flex text-gray-700 dark:text-gray-300 items-center">
                      <svg
                        className="h-5 w-5 text-gray-400 dark:text-gray-600 mr-1"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                      >
                        <path
                          d="M5.64 16.36a9 9 0 1 1 12.72 0l-5.65 5.66a1 1 0 0 1-1.42 0l-5.65-5.66zm11.31-1.41a7 7 0 1 0-9.9 0L12 19.9l4.95-4.95zM12 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
                        />
                      </svg>
                      New York, NY
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 px-2">
                  <button className="flex-1 rounded-full bg-blue-600 dark:bg-blue-800 text-white dark:text-white antialiased font-bold hover:bg-blue-800 dark:hover:bg-blue-900 px-4 py-2">
                    Confirm
                  </button>
                  <button className="flex-1 rounded-full border-2 border-gray-400 dark:border-gray-700 font-semibold text-black dark:text-white px-4 py-2">
                    Decline
                  </button>
                </div>
              </div>
              <div className="px-4 py-4 ">
                <div className="flex gap-2 items-center text-gray-800 dark:text-gray-300 mb-4 cursor-pointer">
                  <svg
                    className="h-6 w-6 text-gray-600 dark:text-gray-400"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1.5 6.5V3.5L18.5 8zM6 4h7v5h5v11H6z"
                    />
                  </svg>
                  <span>Trainer Resume</span>
                </div>
                <div className="flex gap-2 items-center text-gray-800 dark:text-gray-300">
                  <svg
                    className="h-6 w-6 text-gray-600 dark:text-gray-400"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path
                      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2H4v12h16V6zM5 7l7 4.5L19 7V6l-7 4.5L5 6v1z"
                    />
                  </svg>
                  <span>cait.genevieve@email.com</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TrainerRequest;
