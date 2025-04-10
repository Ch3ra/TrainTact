import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Mail, ArrowLeft, Pen } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // Import toast if you're using it

const ClientDescription = () => {
  const upcomingSession = {
    title: "Hi! Train with me",
    time: "Tomorrow, 10:00 AM / 2025-01-30"
  };
  
  const recommendedTrainers = [
    {
      name: "Hari Bhattarai",
      specialty: "Weight Training Specialist",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop"
    },
    {
      name: "Hari Bhattarai",
      specialty: "Weight Training Specialist",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop"
    },
    {
      name: "Hari Bhattarai",
      specialty: "Weight Training Specialist",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop"
    }
  ];
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    address: "",
    fitnessGoal: "",
    fitnessLevel: "",
    height: "",
    weight: "",
    profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop",
    trainerImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop"
  });
  
  const [loading, setLoading] = useState(true);
  const {id} = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Trainer-only authentication check
    const checkTrainerAuth = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        // No token found, redirect to login
        console.log("No token found in ClientDescription");
        toast?.error("Please log in to view client details");
        navigate('/authentication');
        return false;
      }
      
      try {
        // Decode token to check role
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        
        // Debug: Log the token structure to see what fields are available
        console.log("Decoded token in ClientDescription:", decodedToken);
        
        // The role field might be named differently (like userType, accountType, etc.)
        // Check for common variations that might represent user role
        const userRole = decodedToken.role || decodedToken.userRole || decodedToken.userType || 
                         decodedToken.type || decodedToken.accountType;
        
        console.log("Detected user role in ClientDescription:", userRole);
        
        // Check if user is a trainer - be more flexible with role naming
        if (userRole && userRole.toLowerCase() !== 'trainer') {
          console.log("Access denied in ClientDescription: User is not a trainer");
          toast?.error("Only trainers can view client profiles");
          navigate('/authentication');
          return false;
        }
        
        // User is a trainer, continue
        if (id) {
          fetchProfileData(id);
        } else {
          toast?.error("No client ID provided");
          navigate('/trainerDash');
        }
        return true;
      } catch (error) {
        console.error("Failed to decode token in ClientDescription", error);
        console.error("Token content:", token);
        toast?.error("Authentication error. Please log in again.");
        navigate('/authentication');
        return false;
      }
    };
    
    // Run trainer authentication check
    checkTrainerAuth();
  }, [id, navigate]);

  const fetchProfileData = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:3000/api/client/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data) {
        setProfileData({ ...response.data.user, ...response.data.clientDetails });
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      toast?.error("Failed to load client information");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold relative overflow-hidden">Client Profile: {profileData.userName}</h1>
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-12 gap-8 mb-8">
            <div className="col-span-4 bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img 
                    src={
                      profileData.profilePicture 
                        ? `${profileData.profilePicture}`
                        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"
                    } 
                    alt="Profile" 
                    className="w-28 h-28 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop";
                    }}
                  />
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    {profileData.fitnessLevel || "Beginner"}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{profileData.userName || "Client"}</h2>
                <p className="text-gray-500 text-sm text-center">{profileData.location || "No location provided"}</p>
              </div>
            </div>
            
            <div className="col-span-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{profileData.userName || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fitness Goal</p>
                  <p className="font-medium">{profileData.fitnessGoal || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Height</p>
                  <p className="font-medium">{profileData.height || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{profileData.email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Weight</p>
                  <p className="font-medium">{profileData.weight || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fitness Level</p>
                  <p className="font-medium">{profileData.fitnessLevel || "Not specified"}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="font-semibold mb-4">Description</h3>
            <p className="text-gray-600">{profileData.description || "No description provided."}</p>
          </div>

          {/* Health Metrics Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Health Metrics</h3>
              <Link to={`/health-plan/${id}`} className="text-blue-600 text-sm hover:underline">
                Create Health Plan →
              </Link>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-sm">BMI</p>
                <p className="font-medium">
                  {profileData.height && profileData.weight
                    ? (profileData.weight / ((profileData.height / 100) ** 2)).toFixed(1)
                    : "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-sm">Age</p>
                <p className="font-medium">{profileData.age || "N/A"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-sm">Gender</p>
                <p className="font-medium">{profileData.gender || "Not specified"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500 text-sm">Activity Level</p>
                <p className="font-medium">{profileData.activityLevel || "Not specified"}</p>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex justify-end space-x-4">
            <Link 
              to={`/chat/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Message Client
            </Link>
            <Link 
              to={`/create-schedule/${id}`}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Create Training Schedule
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientDescription;