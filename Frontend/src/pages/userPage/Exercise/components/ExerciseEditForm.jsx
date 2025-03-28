import React, { useState, useRef, useEffect } from "react";
import { Camera, Video, X, SendHorizontal, Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const ExerciseEditForm = () => {
  const [activeTab, setActiveTab] = useState("details");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [exerciseData, setExerciseData] = useState({
    exerciseGoal: "",
    days: [
      { dayNumber: 1, activities: "" },
      { dayNumber: 2, activities: "" },
      { dayNumber: 3, activities: "" },
      { dayNumber: 4, activities: "" },
      { dayNumber: 5, activities: "" },
      { dayNumber: 6, activities: "" },
      { dayNumber: 7, activities: "" },
    ],
  });

  // Get exercise ID from URL params or location state
  const { id } = useParams();
  const location = useLocation();
  const exerciseId = id || location.state?.exerciseId;
  const navigate = useNavigate();

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Fetch exercise data
  useEffect(() => {
    const fetchExerciseData = async () => {
      if (!exerciseId) {
        toast.error("No exercise ID provided");
        navigate("/exercises");
        return;
      }

      try {
        setFetchLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:3000/api/exercises/${exerciseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const exercise = response.data.data;

        // Prepare days array with all 7 days
        const fullDaysArray = Array.from({ length: 7 }, (_, i) => ({
          dayNumber: i + 1,
          activities: "",
        }));

        // Fill in the days data from the API response
        if (exercise.days && Array.isArray(exercise.days)) {
          exercise.days.forEach((day) => {
            const index = day.dayNumber - 1;
            if (index >= 0 && index < 7) {
              fullDaysArray[index] = day;
            }
          });
        }

        // Update state with fetched data
        setExerciseData({
          exerciseGoal: exercise.exerciseGoal || "",
          days: fullDaysArray,
        });

        // Set preview images if they exist
        if (exercise.cardPhoto) {
          setPhotoPreview(`http://localhost:3000/${exercise.cardPhoto}`);
        }

        if (exercise.backgroundVideo) {
          setVideoPreview(`http://localhost:3000/${exercise.backgroundVideo}`);
        }

        setFetchLoading(false);
      } catch (error) {
        console.error("Error fetching exercise data:", error);
        toast.error("Failed to fetch exercise data");
        setFetchLoading(false);
      }
    };

    fetchExerciseData();
  }, [exerciseId, navigate]);

  // Set user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUserId(decodedToken.id);
      } catch (error) {
        console.error("Error decoding token:", error);
        toast.error("Authentication error. Please log in again.");
      }
    }
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhotoPreview = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const clearVideoPreview = () => {
    setVideoPreview(null);
    setVideoFile(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleExerciseGoalChange = (e) => {
    setExerciseData({
      ...exerciseData,
      exerciseGoal: e.target.value,
    });
  };

  const handleDayActivityChange = (index, value) => {
    const updatedDays = [...exerciseData.days];
    updatedDays[index] = {
      ...updatedDays[index],
      activities: value,
    };

    setExerciseData({
      ...exerciseData,
      days: updatedDays,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User authentication required");
      return;
    }

    if (!exerciseId) {
      toast.error("Exercise ID is missing");
      return;
    }

    if (!exerciseData.exerciseGoal) {
      toast.error("Please enter an exercise goal");
      setActiveTab("details");
      return;
    }

    // For update, we don't require photo file if there's already a preview
    if (!photoFile && !photoPreview) {
      toast.error("Card photo is required");
      setActiveTab("photo");
      return;
    }

    // Filter out empty days
    const nonEmptyDays = exerciseData.days.filter((day) => day.activities.trim() !== "");

    if (nonEmptyDays.length === 0) {
      toast.error("Please add at least one day with activities");
      setActiveTab("details");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("trainerId", userId);
      formData.append("exerciseGoal", exerciseData.exerciseGoal);

      // Add days as JSON string
      formData.append("days", JSON.stringify(nonEmptyDays));

      // Add files only if they've been changed
      if (photoFile) {
        formData.append("cardPhoto", photoFile);
      }

      if (videoFile) {
        formData.append("backgroundVideo", videoFile);
      }

      const token = localStorage.getItem("token");
      const response = await axios.put(`http://localhost:3000/api/exercises/${exerciseId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type here, it will be automatically set with boundary for FormData
        },
      });

      toast.success("Exercise program updated successfully!");
      console.log("Updated exercise:", response.data);

      // Navigate back to exercises list or details page
      navigate("/exercises");
    } catch (error) {
      console.error("Error updating exercise:", error);
      const errorMessage = error.response?.data?.message || "Failed to update exercise program";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "details", label: "Program Details" },
    { id: "photo", label: "Card Photo" },
    { id: "video", label: "Background Video" },
  ];

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <div className="text-xl font-medium text-gray-700">Loading exercise data...</div>
        <p className="text-gray-500 mt-2">Please wait while we prepare the form</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate("/exercises")} 
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold">Edit Exercise Program</h1>
      </div>

      <form onSubmit={handleFormSubmit}>
        {/* Tabs */}
        <div className="grid grid-cols-3 mb-6 bg-gray-100 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`py-3 px-4 text-center transition-colors ${
                activeTab === tab.id ? "bg-white rounded-t-lg font-semibold" : "text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          {activeTab === "details" && (
            <div>
              <h2 className="text-2xl font-bold mb-1">Exercise Program Details</h2>
              <p className="text-gray-600 mb-6">Update your exercise goal and daily activities</p>

              <div className="mb-6">
                <label htmlFor="exerciseGoal" className="block font-medium mb-2">
                  Exercise Goal
                </label>
                <textarea
                  id="exerciseGoal"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows="4"
                  placeholder="Enter your overall exercise goal"
                  value={exerciseData.exerciseGoal}
                  onChange={handleExerciseGoalChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exerciseData.days.map((day, index) => (
                  <div key={index} className="mb-4">
                    <label htmlFor={`day${index + 1}`} className="block font-medium mb-2">
                      Day {index + 1}
                    </label>
                    <textarea
                      id={`day${index + 1}`}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows="3"
                      placeholder={`Day ${index + 1} exercises`}
                      value={day.activities}
                      onChange={(e) => handleDayActivityChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "photo" && (
            <div>
              <h2 className="text-2xl font-bold mb-1">Card Photo</h2>
              <p className="text-gray-600 mb-6">Update the photo for your exercise program card</p>

              {photoPreview ? (
                <div className="relative">
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      type="button"
                      onClick={clearPhotoPreview}
                      className="bg-black bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <img src={photoPreview} alt="Preview" className="w-full h-64 object-cover" />
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    ref={photoInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handlePhotoChange}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#CE0000] transition-colors">
                    <div className="flex justify-center mb-4">
                      <Camera size={48} className="text-gray-500" />
                    </div>
                    <p className="text-gray-600 mb-1">Click to upload a photo</p>
                    <p className="text-gray-500 text-sm">PNG, JPG or GIF up to 10MB</p>
                  </div>
                </label>
              )}
            </div>
          )}

          {activeTab === "video" && (
            <div>
              <h2 className="text-2xl font-bold mb-1">Background Video</h2>
              <p className="text-gray-600 mb-6">Update the background video for your exercise program (optional)</p>

              {videoPreview ? (
                <div className="relative">
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      type="button"
                      onClick={clearVideoPreview}
                      className="bg-black bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <video src={videoPreview} controls className="w-full h-64 object-cover" />
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    ref={videoInputRef}
                    className="hidden"
                    accept="video/mp4, video/webm"
                    onChange={handleVideoChange}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#CE0000] transition-colors">
                    <div className="flex justify-center mb-4">
                      <Video size={48} className="text-gray-500" />
                    </div>
                    <p className="text-gray-600 mb-1">Click to upload a video</p>
                    <p className="text-gray-500 text-sm">MP4 or WebM up to 50MB</p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#CE0000] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#AE0000] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <SendHorizontal size={20} className="mr-2" />
                Update Exercise Program
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExerciseEditForm;