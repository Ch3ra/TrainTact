import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Mail, ArrowLeft, Pen } from 'lucide-react';
import { useParams } from 'react-router-dom';

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
  const {id}=useParams();
  useEffect(() => {
    
    if (id){
        try {
           
            fetchProfileData(id);
          } catch (error) {
            console.error("Error decoding token:", error);
          }
    }
  }, []);


  const fetchProfileData = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/client/${id}`);
      if (response.data) {
        setProfileData({ ...response.data.user, ...response.data.clientDetails }); // Assuming data is split as user and clientDetails
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
     
      <div className="flex">
        
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold relative overflow-hidden">Welcome back, {profileData.userName}!</h1>
            <ArrowLeft className="w-6 h-6 cursor-pointer hover:bg-gray-100 rounded-full p-1" />
          </div>
          <div className="grid grid-cols-12 gap-8 mb-8">
            <div className="col-span-4 bg-white rounded-lg shadow p-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img src={profileData.profilePicture} alt="Profile" className="w-28 h-28 rounded-full object-cover" />
                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">{profileData.fitnessLevel}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{profileData.userName}</h2>
                <p className="text-gray-500 text-sm text-center">{profileData.location}</p>
              </div>
            </div>
            <div className="col-span-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{profileData.userName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fitness Goal</p>
                  <p className="font-medium">{profileData.fitnessGoal}</p>
                </div>
                <div>
                  <p className="text-gray-500">Height</p>
                  <p className="font-medium">{profileData.height}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{profileData.email}</p>
                </div>
              
                <div>
                  <p className="text-gray-500">Weight</p>
                  <p className="font-medium">{profileData.weight}</p>
                </div>
              </div>
             
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="font-semibold mb-4">Description</h3>
            <p className="text-gray-500">{profileData.description}</p>
          </div>
         
          
   
        </main>
      </div>
    </div>
  );
};

export default ClientDescription;










 {/* Recommended Trainers */}
 