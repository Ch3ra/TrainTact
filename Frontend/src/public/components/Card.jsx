import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ image, name, role }) => {
  return (
    <div className="flex ml-7 pt-5">
      <div className="relative group overflow-hidden rounded-lg shadow-lg cursor-pointer w-72">
        {/* Info Panel that slides down from top */}
        <div className="absolute top-0 left-0 w-full transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out z-10 bg-red-700 text-white p-3">
          <h2 className="text-xl text-black font-bold">{name}</h2>
          <p className="text-base">{role}</p>
        </div>

        {/* Image container with improved aspect ratio and positioning */}
        <div className="relative w-full pb-[120%] transform group-hover:translate-y-14 transition-transform duration-500 ease-in-out">
          <img 
            src={image}
            alt={`${role} - ${name}`}
            className="absolute inset-0 w-full h-full object-cover object-top"
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