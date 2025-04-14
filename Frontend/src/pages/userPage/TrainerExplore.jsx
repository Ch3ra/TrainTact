import React, { useState, useEffect } from 'react';
import Navbar from '../../public/components/Navbar';
import Footer from "../../public/components/Footer"
import { Link } from 'react-router-dom';

const TrainerSearch = () => {
  const [sortOption, setSortOption] = useState('Highest Rated');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [trainerRatings, setTrainerRatings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalTrainers, setTotalTrainers] = useState(0);

  // Fetch trainers with complete profiles
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3000/api/trainer/completeProfiles');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched trainers:', data);
        
        if (data.success && data.data) {
          // Save the trainers data
          const trainerData = data.data;
          setTrainers(trainerData);
          setFilteredTrainers(trainerData);
          setTotalTrainers(trainerData.length);
          
          // Fetch ratings for each trainer
          const trainerIds = trainerData.map(trainer => trainer.ID);
          await fetchTrainerRatings(trainerIds);
        } else {
          throw new Error(data.message || 'Failed to fetch trainers');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching trainers:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    const fetchTrainerRatings = async (trainerIds) => {
      try {
        const ratingsData = {};
        
        // Fetch ratings for each trainer
        for (const trainerId of trainerIds) {
          if (!trainerId) continue;
          
          const response = await fetch(`http://localhost:3000/api/ratings/trainer/${trainerId}`);
          
          if (response.ok) {
            const data = await response.json();
            ratingsData[trainerId] = {
              averageRating: data.averageRating || 0,
              count: data.count || 0
            };
          } else {
            console.log(`No ratings found for trainer ${trainerId}`);
            ratingsData[trainerId] = { averageRating: 0, count: 0 };
          }
        }
        
        setTrainerRatings(ratingsData);
      } catch (error) {
        console.error('Error fetching trainer ratings:', error);
      }
    };

    fetchTrainers();
  }, []);

  // Search and sort trainers
  useEffect(() => {
    if (trainers.length > 0) {
      let results = [...trainers];
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        results = results.filter(trainer => 
          (trainer.username && trainer.username.toLowerCase().includes(searchLower)) ||
          (trainer.fitnessGoal && trainer.fitnessGoal.toLowerCase().includes(searchLower)) ||
          (trainer.location && trainer.location.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply sorting
      results = sortTrainers(results, sortOption);
      
      setFilteredTrainers(results);
      setTotalTrainers(results.length);
      setCurrentPage(1); // Reset to first page when search/sort changes
    }
  }, [searchTerm, sortOption, trainers]);

  // Sort trainers based on selected option
  const sortTrainers = (trainersToSort, option) => {
    switch (option) {
      case 'Highest Rated':
        return [...trainersToSort].sort((a, b) => {
          const ratingA = trainerRatings[a.ID]?.averageRating || 0;
          const ratingB = trainerRatings[b.ID]?.averageRating || 0;
          return ratingB - ratingA;
        });
      case 'Lowest Price':
        return [...trainersToSort].sort((a, b) => {
          const priceA = a.price || Number.MAX_VALUE;
          const priceB = b.price || Number.MAX_VALUE;
          return priceA - priceB;
        });
      case 'Highest Price':
        return [...trainersToSort].sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceB - priceA;
        });
      default:
        return trainersToSort;
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search is already handled by the useEffect
  };

  // Calculate total pages for pagination
  const itemsPerPage = 3;
  const totalPages = Math.ceil(totalTrainers / itemsPerPage);

  // Get current trainers for display
  const indexOfLastTrainer = currentPage * itemsPerPage;
  const indexOfFirstTrainer = indexOfLastTrainer - itemsPerPage;
  const currentTrainers = filteredTrainers.slice(indexOfFirstTrainer, indexOfLastTrainer);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i <= 3 || i === totalPages || i === currentPage) {
        pages.push(
          <button
            key={i}
            className={`w-10 h-10 mx-1 flex items-center justify-center rounded-lg ${
              currentPage === i ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'
            }`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      } else if (i === 4 && totalPages > 4) {
        pages.push(
          <span key="ellipsis" className="mx-1">...</span>
        );
      }
    }
    return pages;
  };

  // Function to extract specialties from fitness goal
  const extractSpecialties = (fitnessGoal) => {
    if (!fitnessGoal) return ["General Training"];
    // Split by commas or other delimiters if your data is structured that way
    return fitnessGoal.split(/,\s*/).map(s => s.trim());
  };

  // Function to get trainer's rating information
  const getTrainerRating = (trainerId) => {
    if (!trainerId || !trainerRatings[trainerId]) {
      return { averageRating: 0, count: 0 };
    }
    return trainerRatings[trainerId];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* CSS for the custom price tag */}
      <Navbar/>
      <style jsx>{`
        .price-tag {
          position: absolute;
          top: 0;
          left: 0;
          background-color: #dc2626;
          color: white;
          font-weight: bold;
          padding: 6px 15px;
          font-size: 16px;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
        }
      `}</style>

      {/* Hero Search Section */}
      <div className="relative bg-gray-900 py-16 px-4">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.pexels.com/photos/13534122/pexels-photo-13534122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
            alt="Fitness background" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Find Your Perfect Trainer</h1>
          <p className="text-xl text-gray-300 mb-8">
            Browse our network of certified fitness professionals and find the perfect match for your fitness goals
          </p>
          
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-4xl mx-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-3 w-full rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Search by name, specialty, or location..."
              />
            </div>
            <button 
              type="submit"
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-r-lg flex items-center"
            >
              <span>Search</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Trainers Listing Section */}
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{totalTrainers} Trainers Available</h2>
          <div className="flex items-center">
            <span className="mr-2 text-gray-600">Sort by:</span>
            <div className="relative">
              <select 
                className="appearance-none bg-white border rounded-md py-2 pl-3 pr-10 text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option>Highest Rated</option>
                <option>Lowest Price</option>
                <option>Highest Price</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Trainer Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40 text-red-500">
            {error.includes('404') 
              ? "No trainers available at the moment. Please check back later!" 
              : `Error: ${error}`
            }
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="flex justify-center items-center h-40 text-gray-500">
            {searchTerm 
              ? `No trainers found matching "${searchTerm}". Try a different search term.` 
              : "No trainers found. Please try again later!"}
          </div>
        ) : (
          <div className="space-y-6">
            {currentTrainers.map((trainer) => {
              const rating = getTrainerRating(trainer.ID);
              
              return (
                <div key={trainer.ID} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="flex">
                    {/* Left side with image and price */}
                    <div className="relative w-1/3 bg-gray-200">
                      <div className="price-tag">{trainer.price ? `$${trainer.price}/hr` : 'TBD'}</div>
                      <div className="h-full flex items-center justify-center">
                        <img 
                          src={trainer.profilePicture} 
                          alt={trainer.username} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>

                    {/* Right side with trainer info */}
                    <div className="w-2/3 p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-bold">{trainer.username}</h3>
                          <p className="text-gray-600 mb-4">{trainer.fitnessGoal}</p>
                          
                          <div className="flex items-center text-gray-600 mb-4">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {trainer.location || "Location not specified"}
                          </div>
                        </div>

                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="ml-1 text-gray-900 font-bold">
                            {rating.averageRating > 0 ? rating.averageRating.toFixed(1) : 'N/A'}
                          </span>
                          <span className="ml-1 text-gray-500">({rating.count})</span>
                        </div>
                      </div>

                      {/* Advanced Payment Indicator */}
                      {trainer.advancedNeeded !== undefined && (
                        <div className={`mb-4 px-3 py-2 rounded-md ${
                          trainer.advancedNeeded 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          <div className="flex items-center">
                            <svg className={`w-5 h-5 mr-2 ${trainer.advancedNeeded ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">
                              {trainer.advancedNeeded 
                                ? 'Advanced Payment Required' 
                                : 'Advanced Payment Not Required'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Specialties:</h4>
                        <div className="flex flex-wrap gap-2">
                          {extractSpecialties(trainer.fitnessGoal).map((specialty, index) => (
                            <span 
                              key={index} 
                              className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Age: {trainer.age || "Not specified"}</span>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <Link to={`/trainerDetails/${trainer.ID}`}>
                          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full flex items-center transition-colors">
                            View Profile
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </Link>
                        <Link to={`/trainerDetails/${trainer.ID}`}>
                          <button className="border border-red-600 text-red-600 hover:bg-red-50 px-6 py-2 rounded-full transition-colors">
                            Book Session
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && filteredTrainers.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex">{renderPagination()}</div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
};

export default TrainerSearch;