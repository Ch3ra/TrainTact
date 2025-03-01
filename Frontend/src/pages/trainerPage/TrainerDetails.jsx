import React, { useEffect, useState } from "react";
import {

  Mail,
  LogOut,
  Edit,
  ArrowLeft,
  User,
  MapPin,
  Clock,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import TrainerNavbar from "../../pages/trainerPage/TrainerNavbar";
import axios from 'axios'; 
import { useParams } from 'react-router-dom';

const TrainerDetails = () => {
  const [userId, setUserId] = useState(null);
  const [trainerDetails, setTrainerDetails] = useState(null);
   const [advancedNeeded, setAdvancedNeeded] = useState(false);
  
  const {id}=useParams();
  useEffect(() => {
    
    if (id){
        try {
           
            fetchTrainerDetails(id);
          } catch (error) {
            console.error("Error decoding token:", error);
          }
    }
  }, []);


  const fetchTrainerDetails = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/trainer/details/${id}`);
      if (response.status === 200) {
        const trainerData = response.data.trainer;
        setTrainerDetails(trainerData);
        setAdvancedNeeded(trainerData.advancedNeeded); // Store advancedNeeded in state
        console.log("Trainer Data:", trainerData);
      }
    } catch (error) {
      console.error("Failed to fetch trainer details", error);
    }
  };
//ya xqaii book from haii


const [modalOpen, setModalOpen] = useState(false);
const [formData, setFormData] = useState({
  startTime: '',
  duration: '',
  startDate: '',
  endDate: '',
  message: ''
});
const { id: trainerId } = useParams(); // This is the trainerId from URL

// Fetch client ID from local storage upon component mount
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    setUserId(decodedToken.id); // Assuming 'id' is the field in your token containing the client ID
  }
}, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(userId,trainerId)
    if (!userId || !trainerId) {
      console.error('Client ID or Trainer ID is missing.');
      return;
    }
// yo set garney local stora
localStorage.setItem('data',{
  clientId: userId,
  trainerId: trainerId,
 ...formData
})

    try {
      const response = await axios.post('http://localhost:3000/api/availability/createSchedule', {
        clientId: userId,
        trainerId: trainerId,
        ...formData
      });

     
      console.log('Response:', response.data);
      setModalOpen(false); // Close modal on successful submission
    } catch (error) {
      console.error('Failed to create schedule:', error.response ? error.response.data : error.message);
    }
  };


  const handleKhalti = async ()=>
  {
    const bookingDetails = {
      clientId: userId,
      trainerId: trainerId,
      price : trainerDetails.price,
      ...formData
    };
  
    // Set the booking details in localStorage first
    try {
      localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));
      console.log('Successfully saved booking details to localStorage:', bookingDetails);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    

    const response = await axios.post("http://localhost:3000/api/payment",{
      "orderId":123,
    "amount":trainerDetails.price
    })

    console.log("Khalti",response)
    
 
      var url = response.data
      window.location.href = url
    
  }
  
  return (
   <div className="bg-gray-50 min-h-screen">
<TrainerNavbar />

<div className="flex">
  {/* Sidebar */}
 

  {/* Main Content */}
<main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Welcome back, {trainerDetails ? trainerDetails.userName : 'Trainer'}!</h2>
          <button className="w-10 h-10 border rounded-full flex items-center justify-center hover:bg-gray-50">
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm">
          {/* Cover Image */}
          <div className="h-64 bg-gray-900 rounded-t-2xl overflow-hidden">
          <img
    src={trainerDetails ? `http://localhost:3000/uploads/coverPhoto/${trainerDetails.coverPhoto}` : "https://timelinecovers.pro/facebook-cover/download/You-Are-A-Dreamer-HD-facebook-cover.jpg"}
    alt="cover"
    className="w-full h-full object-cover opacity-75"
  />
</div>



          {/* Profile Info */}
          <div className="relative px-8 pt-32 pb-8">
            <div className="absolute -top-[130px] left-8">
            <div className="relative">
            {advancedNeeded && (
  <span className="absolute top-52 ml-28 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg translate-x-1/2 -translate-y-1/2">
    Pre Advance
  </span>
)}

  <div className="w-[210px] h-[210px] rounded-full mt-4 border-4 border-white shadow-lg overflow-hidden relative">
    <img
      src={trainerDetails ? `http://localhost:3000/uploads/profilePictures/${trainerDetails.profilePicture}` : "https://timelinecovers.pro/facebook-cover/download/You-Are-A-Dreamer-HD-facebook-cover.jpg"}
      alt="cover"
      className="w-full h-full object-cover"
    />
   
     
  
  </div>
</div>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <User size={20} className="text-gray-500" />
                  <span className="font-medium">{trainerDetails ? trainerDetails.userName : 'Alish Ban'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin size={20} />
                  <span>{trainerDetails ? trainerDetails.location : 'Itahari-3, Bhetghat Chowk'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail size={20} />
                  <p className="font-medium">{trainerDetails ? trainerDetails.email : 'alishban@gmail.com'}</p>
                </div>
              </div>
            </div>
            {/* Profile Details Grid */}
            <div className="grid grid-cols-2 gap-8 mt-4">
              <div className="space-y-4"></div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <label className="text-gray-500 text-sm">Price</label>
                  <p className="font-medium">{trainerDetails ? trainerDetails.price + ' NPR' : '4000 NPR'}</p>
                </div>
                <div className="flex space-x-2">
                  <label className="text-gray-500 text-sm">
                    Years of Experience
                  </label>
                  <p className="font-medium">{trainerDetails ? trainerDetails.yearsOfExperience + ' Years' : '5 Years'}</p>
                </div>
                <div className="flex space-x-2">
                  <label className="text-gray-500 text-sm">
                    Fitness Goal
                  </label>
                  <p className="font-medium">{trainerDetails ? trainerDetails.fitnessGoal : 'Weight Gain'}</p>
                </div>
              </div>
              <div className="w-[700px]">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-gray-600 leading-relaxed">
                    {trainerDetails ? trainerDetails.description : 'Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.'}
                  </p>
                </div>
              </div>
            </div>
            {/* Availability Badge */}
            <div className="absolute top-6 ml-[440px] w-64">
              <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-red-50 px-4 py-3 flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-semibold text-red-600">
                    Available: {trainerDetails ? trainerDetails.availabilityHours : 'Evening'}
                  </p>
                </div>
                <div className="px-4 py-3 flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <p className="text-sm text-gray-600">{trainerDetails ? trainerDetails.startDay + ' - ' + trainerDetails.endDay : 'Sunday - Friday'}</p>
                </div>
              </div>
            </div>
            {/* Edit Profile Button */}
            
            <button className="absolute top-64 right-7 bg-red-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-red-700 transition-colors" onClick={() => setModalOpen(true)}>
              <Edit size={16} />
              Book Appoinment
            </button>


            {modalOpen && (
  <div
    id="crud-modal"
    tabIndex="-1"
    className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full flex bg-black/40 backdrop-blur-sm"
  >
    <div className="relative p-4 w-full max-w-md max-h-full">
      <div className="relative bg-white/90 backdrop-filter backdrop-blur-md rounded-xl shadow-2xl border border-gray-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-gray-200">
          <h3 className="text-xl font-bold text-[#CE0000]">
            Choose Workout Schedule
          </h3>
          <button
            onClick={() => setModalOpen(false)}
            type="button"
            className="text-gray-400 hover:text-[#CE0000] bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center transition-colors duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5">
          <div className="grid gap-4 mb-4 grid-cols-2">
            {/* Start Time */}
            <div className="col-span-2">
              <label htmlFor="startTime" className="block mb-2 text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                id="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#CE0000] focus:border-[#CE0000] block w-full p-2.5"
                required
              />
            </div>

            {/* Duration */}
            <div className="col-span-2 sm:col-span-1 relative">
              <label htmlFor="duration" className="block mb-2 text-sm font-medium text-gray-700">
                Duration
              </label>
              <select
                name="duration"
                id="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#CE0000] focus:border-[#CE0000] block w-full p-2.5 pr-8"
                required
              >
                <option value="">Select Duration</option>
                <option value="45">45 min</option>
                <option value="90">1.30 hrs</option>
                <option value="120">2 hrs</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 pt-5 text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </div>
            </div>

            {/* Start Date */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="startDate" className="block mb-2 text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#CE0000] focus:border-[#CE0000] block w-full p-2.5"
                required
              />
            </div>

            {/* End Date */}
            <div className="col-span-2">
              <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#CE0000] focus:border-[#CE0000] block w-full p-2.5"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#CE0000] hover:bg-[#A80000] text-white font-semibold py-3 px-5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:ring-2 focus:ring-[#CE0000]/50 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Book Appointment
            </button>

            {/* Payment Buttons */}
          <div className="space-y-3">
  {/* Khalti Button */}
  <button
    type="button"
    onClick={handleKhalti}
    className="w-full bg-white hover:bg-[#5C2D91] text-[#5C2D91] hover:text-white font-medium py-2.5 px-5 rounded-lg border border-gray-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
  >
    <div className="w-6 h-6 flex items-center justify-center">
      {/* Image placeholder for Khalti logo */}
      <img src="/khalti-logo.png" alt="Khalti Logo" className="w-full h-full object-contain" />
    </div>
    Pay with Khalti
  </button>

  {/* Esewa Button */}
  <button
    type="button"
    className="w-full bg-white hover:bg-[#60BB46] text-[#60BB46] hover:text-white font-medium py-2.5 px-5 rounded-lg border border-gray-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
  >
    <div className="w-6 h-6 flex items-center justify-center">
      {/* Image placeholder for Esewa logo */}
      <img src="/esewa-logo.png" alt="Esewa Logo" className="w-full h-full object-contain" />
    </div>
    Pay with Esewa
  </button>
</div>
          </div>
        </form>
      </div>
    </div>
  </div>
)}


           
          </div>
        </div>
  
      </main>

      
</div>

</div>


  );
};

export default TrainerDetails;



