import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import Navbar from './../public/components/Navbar';
import SearchBar from './../form/searchbar/SearchBar';
import Card from './../public/components/Card';
import aboutus from "./../assets/images/video3.mp4";
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Pagination from '../public/components/Paginatiom';


const ClientDash = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trainers, setTrainers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  

 

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

    fetchTrainers();
  }, []);

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
    </>
  );
};

export default ClientDash;