import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import Navbar from './../public/components/Navbar';
import SearchBar from './../form/searchbar/SearchBar';
import Card from './../public/components/Card';
import aboutus from "./../assets/images/video3.mp4";
import {NavLink} from 'react-router-dom';
import Pagination from '../public/components/Paginatiom';
import { useNavigate } from "react-router-dom";


const ClientDash = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trainers, setTrainers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  
  // Add authentication check on component mount
  useEffect(() => {
    // Authentication check
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        // No token found, redirect to login
        console.log("No token found");
        navigate('/authentication');
        return false;
      }
      
      try {
        // Decode token to check role
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        
        // Debug: Log the token structure to see what fields are available
        console.log("Decoded token:", decodedToken);
        
        // The role field might be named differently (like userType, accountType, etc.)
        // Check for common variations that might represent user role
        const userRole = decodedToken.role || decodedToken.userRole || decodedToken.userType || 
                         decodedToken.type || decodedToken.accountType;
        
        console.log("Detected user role:", userRole);
        
        // Check if user is a client - be flexible with role naming
        if (userRole && userRole.toLowerCase() !== 'client') {
          console.log("Access denied: User is not a client");
          navigate('/authentication');
          return false;
        }
        
        // User is a client (or we couldn't determine otherwise), set userId and continue
        setUserId(decodedToken.id);
        return true;
      } catch (error) {
        console.error("Failed to decode token", error);
        console.error("Token content:", token);
        navigate('/authentication');
        return false;
      }
    };
    
    // Run auth check
    checkAuth();
  }, [navigate]);
  
  useEffect(() => {
    const checkProfileComplete = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
  
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const response = await fetch(`http://localhost:3000/api/client/${decodedToken.id}`);
        const data = await response.json();
  
        // Check if required fields are present
        const requiredFields = [
          data.user?.fitnessGoal,
          data.user?.location,
          data.clientDetails?.height,
          data.clientDetails?.weight,
          data.clientDetails?.fitnessLevel
        ];
  
        const isComplete = requiredFields.every(field => 
          field !== undefined && field !== null && field !== ''
        );
  
        if (!isComplete) setShowProfileModal(true);
      } catch (error) {
        console.error("Profile check error:", error);
      }
    };
  
    // Only check profile if user is authenticated and userId is set
    if (userId) {
      checkProfileComplete();
    }
  }, [userId]);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/trainer/completeProfiles');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setTrainers(data.data);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Fetching trainers failed:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    // Only fetch trainers if user is authenticated and userId is set
    if (userId) {
      fetchTrainers();
    }
  }, [userId]);

  const trainerCategories = [
    "Yoga", 
    "Bodybuilding", 
    "Weight Loss", 
    "Weight Gain", 
    "Cardio", 
    "Strength Training"
  ];

  const filteredTrainers = selectedCategory 
    ? trainers.filter(trainer => trainer.specialization === selectedCategory)
    : trainers;

  return (
    <>
      <Navbar />
      <div className="relative w-full h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-20"></div>

        <video 
          autoPlay 
          loop 
          muted 
          className="absolute z-10 w-full h-[400px] object-cover brightness-75"
        >
          <source src={aboutus} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="absolute z-30 top-[35%] left-[5%] transform -translate-y-1/2 text-left max-w-[700px]">
          <div className="overflow-hidden mb-2">
            <h1 
              className="text-6xl font-black text-transparent bg-clip-text 
                       bg-gradient-to-r from-red-500 to-orange-400 
                       tracking-tight leading-[1.1] 
                       opacity-0 
                       animate-fadeIn"
              style={{ 
                animationDelay: '0.2s', 
                fontFamily: "'Inter', sans-serif",
                animationFillMode: 'forwards'
              }}
            >
              Fitness
            </h1>
          </div>

          <div className="overflow-hidden mb-1">
            <h2 
              className="text-4xl font-extrabold text-white 
                       tracking-wide leading-[1.2] 
                       opacity-0 
                       animate-fadeIn"
              style={{ 
                animationDelay: '0.4s', 
                fontFamily: "'Inter', sans-serif",
                animationFillMode: 'forwards'
              }}
            >
              Keep Your Body
            </h2>
          </div>

          <div className="overflow-hidden mb-6">
            <h2 
              className="text-4xl font-extrabold text-white 
                       tracking-wide leading-[1.2] 
                       opacity-0 
                       animate-fadeIn"
              style={{ 
                animationDelay: '0.6s', 
                fontFamily: "'Inter', sans-serif",
                animationFillMode: 'forwards'
              }}
            >
              Fit & Strong
            </h2>
          </div>

          <div 
            className="w-full opacity-0 animate-fadeIn"
            style={{ 
              animationDelay: '0.8s', 
              animationFillMode: 'forwards'
            }}
          >
            <SearchBar style={{
              maxWidth: '400px',
              borderRadius: '25px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.8)',
              color: 'white',
            }} />
          </div>
        </div>
      </div>

      <div className='mt-6 flex flex-col space-y-6'>
        <div className='flex items-center px-4 space-x-4'>
          <div className='relative'>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className='flex items-center justify-center w-52 h-12 bg-white text-black 
                         px-4 py-2 rounded-lg shadow-md hover:bg-gray-200 
                         transition duration-300 ease-in-out space-x-2'
            >
              <Filter className='w-5 h-5' />
              <span className='text-sm font-semibold'>
                {selectedCategory || 'Filter Trainers'}
              </span>
              <ChevronDown className='w-4 h-4 ml-2' />
            </button>
            {isDropdownOpen && (
              <ul className='absolute z-10 w-52 bg-white border border-gray-200 
                             rounded-lg shadow-lg mt-2 overflow-hidden'>
                <li 
                  className='px-4 py-3 hover:bg-gray-100 cursor-pointer 
                             text-sm transition duration-200 ease-in-out'
                  onClick={() => {
                    setSelectedCategory(null);
                    setIsDropdownOpen(false);
                  }}
                >
                  All Trainers
                </li>
                {trainerCategories.map((category) => (
                  <li 
                    key={category}
                    className='px-4 py-3 hover:bg-gray-100 cursor-pointer 
                               text-sm transition duration-200 ease-in-out'
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {category}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            Loading trainers...
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40 text-red-500">
            {error.includes('404') 
              ? "No trainers available at the moment. Please check back later!" 
              : `Error: ${error}`
            }
          </div>
        ) : trainers.length === 0 ? (
          <div className="flex justify-center items-center h-40 text-gray-500">
            No trainers found. Please try again later!
          </div>
        ) : (
          <div className="flex gap-4 px-4">
            {filteredTrainers.map((trainer, index) => (
              <NavLink key={trainer._id || index} to={`/trainerDetails/${trainer.ID}`}>
                <Card
                  name={trainer.username || trainer.name}
                  role={trainer.fitnessGoal}
                  image={trainer.profilePicture || 'default-profile-picture.jpg'}
                />
              </NavLink>
            ))}
          </div>
        )}
      </div>
      
      <div className='flex justify-center mt-4'>
        <Pagination/>
      </div>

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Profile Incomplete</h3>
            <p className="text-gray-600 mb-6">
              Please complete your profile information to get the best experience.
              Would you like to fill it now?
            </p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Later
              </button>
              <button 
                onClick={() => navigate('/addprofile')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes, Fill Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientDash;