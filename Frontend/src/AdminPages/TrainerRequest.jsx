import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";
// Frontend ma mistake xa usernot found yelaii fix hannaay hooo!!
const TrainerRequest = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch trainer data from the backend
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/trainer/getAllTrainers"
        );
        setTrainers(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching trainers:", error);
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  // Handle trainer confirmation
  const handleConfirm = async (userId) => {
    if (!window.confirm("Are you sure you want to confirm this trainer?")) {
      return;
    }
  
    setActionLoading(true);
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/trainer/updateOtpVerification/${userId}`,
        { isVerified: true } // Sending `isVerified` as true
      );
  
      if (response.data.success) {
        alert("Trainer confirmed successfully!");
        // Remove the confirmed trainer from the list
        setTrainers((prevTrainers) =>
          prevTrainers.filter((trainer) => trainer.user._id !== userId)
        );
      } else {
        alert("Failed to confirm trainer");
      }
    } catch (error) {
      console.error("Error confirming trainer:", error);
      alert("An error occurred while confirming the trainer");
    } finally {
      setActionLoading(false);
    }
  };
  

  // Handle trainer deletion
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to decline this trainer? This action cannot be undone."
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.delete(
        `http://localhost:3000/api/trainer/deleteTrainer/${id}`
      );

      if (response.data.success) {
        alert("Trainer declined successfully.");
        // Remove the declined trainer from the list
        setTrainers((prevTrainers) =>
          prevTrainers.filter((trainer) => trainer._id !== id)
        );
      } else {
        alert("Failed to decline trainer");
      }
    } catch (error) {
      console.error("Error declining trainer:", error);
      alert("An error occurred while declining the trainer");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div>
        <AdminNavbar />
      </div>

      <div className="h-max bg-gray-200 pt-12">
        {loading ? (
          <div className="text-center text-gray-700 mt-[80px]">
            Loading trainers...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 px-8 ml-10 mt-10">
            {trainers.length > 0 ? (
              trainers.map((trainer) => (
                <div
                  key={trainer._id}
                  className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg"
                >
                  <div className="border-b px-4 pb-6">
                    <div className="text-center my-4">
                      {/* Profile Picture */}
                      <img
                        className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-800 mx-auto my-4"
                        src={
                          trainer.user?.profilePicture
                            ? trainer.user.profilePicture
                            : "https://via.placeholder.com/150"
                        }
                        alt={trainer.user?.userName || "Unknown"}
                      />
                      <div className="py-2">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-1">
                          {trainer.user?.userName || "Unknown Trainer"}
                        </h3>
                        <div className="text-gray-700 dark:text-gray-300 flex items-center">
                          {/* Email */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15a2.25 2.25 0 0 1-2.25-2.25V6.75Zm1.5 0v.662L12 12l8.25-4.588V6.75a.75.75 0 0 0-.75-.75h-15a.75.75 0 0 0-.75.75Zm0 2.694v7.056a.75.75 0 0 0 .75.75h15a.75.75 0 0 0 .75-.75V9.444l-7.75 4.306a1.5 1.5 0 0 1-1.5 0L3.75 9.444Z" />
                          </svg>
                          <span>{trainer.user?.email || "Unknown Email"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 px-2">
                    <button
  onClick={() => handleConfirm(trainer.user?._id)} // Use `user._id`
  className={`flex-1 rounded-full bg-blue-600 dark:bg-blue-800 text-white antialiased font-bold hover:bg-blue-800 dark:hover:bg-blue-900 px-4 py-2 ${
    actionLoading && "opacity-50 cursor-not-allowed"
  }`}
  disabled={actionLoading}
>
  Confirm
</button>

                      <button
                        onClick={() => handleDelete(trainer._id)}
                        className={`flex-1 rounded-full border-2 border-gray-400 dark:border-gray-700 font-semibold text-black dark:text-white px-4 py-2 ${
                          actionLoading && "opacity-50 cursor-not-allowed"
                        }`}
                        disabled={actionLoading}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-4">
                    <div className="text-gray-800 dark:text-gray-300">
                      {/* Resume */}
                      <div className="flex items-center mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6.75 2.25A2.25 2.25 0 0 0 4.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 19.5V8.25L14.25 2.25H6.75Zm7.5 2.25V8.25h4.5l-4.5-3.75ZM6.75 12h10.5v1.5H6.75V12Zm0 3.75h7.5v1.5h-7.5v-1.5Z" />
                        </svg>
                        <span>
                          {trainer.resume ? (
                            <a
                              href={`http://localhost:3000${trainer.resume}`}
                              className="text-blue-500"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Resume
                            </a>
                          ) : (
                            "Not Provided"
                          )}
                        </span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 flex items-center">
                          {/* Email */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15a2.25 2.25 0 0 1-2.25-2.25V6.75Zm1.5 0v.662L12 12l8.25-4.588V6.75a.75.75 0 0 0-.75-.75h-15a.75.75 0 0 0-.75.75Zm0 2.694v7.056a.75.75 0 0 0 .75.75h15a.75.75 0 0 0 .75-.75V9.444l-7.75 4.306a1.5 1.5 0 0 1-1.5 0L3.75 9.444Z" />
                          </svg>
                          <span>{trainer.user?.email || "Unknown Email"}</span>
                        </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-700">
                No trainers found.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TrainerRequest;
