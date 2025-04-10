import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ image, name, role, rating = 4.8 }) => {
  // Default image if none provided
  const defaultImage = "https://images.pexels.com/photos/258007/pexels-photo-258007.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
  
  return (
    <div className="flex ml-7 pt-5">
      <div className="relative group overflow-hidden rounded-lg shadow-lg cursor-pointer w-72">
        {/* Info Panel that slides down from top */}
        <div className="absolute top-0 left-0 w-full transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out z-10 bg-red-700 text-white p-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{name}</h2>
            <div className="flex items-center bg-white bg-opacity-20 rounded px-2 py-1">
              <span className="text-white font-bold">{rating}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <p className="text-base text-white mt-1">{role}</p>
        </div>

        {/* Image container with improved aspect ratio and positioning */}
        <div className="relative w-full pb-[120%] transform group-hover:translate-y-14 transition-transform duration-500 ease-in-out">
          <img 
            src={image || defaultImage}
            alt={`${role} - ${name}`}
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = defaultImage;
            }}
          />
        </div>

        {/* Overlay with social icons and button */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-500 ease-in-out flex flex-col items-center justify-end pb-6">
          {/* See More Button */}
          <button className="px-5 py-1.5 bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200 hover:bg-red-800 transform hover:scale-105 transition-all text-sm">
            Explore More
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card;