import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../public/components/Navbar';
import pic1 from "../../assets/images/pic1.jpg";
import pic2 from "../../assets/images/pic2.jpg";
import pic3 from "../../assets/images/pic3.jpg";
import { Link } from 'react-router-dom';

const ExerciseSection = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState('Category');
  const dropdownRef = useRef(null);

  const exercises = [
    {
      name: "Alish Ban",
      role: "Weight Gain",
      image: pic1
    },
    {
      name: "William Dixon",
      role: "Bodybuilding Coach",
      image: pic2
    },
    {
      name: "Rojesh Giri",
      role: "Weight Loss",
      image: pic3
    }
  ];

  // Toggle the visibility of the dropdown menu
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // Set the selected item and close the dropdown
  const handleSelectItem = (value) => {
    setSelectedItem(value);
    setDropdownOpen(false);
  };

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <Navbar />
      <div className="flex justify-center w-full mt-5">
        <div className="relative w-full max-w-sm min-w-[200px]">
          <div className="absolute top-1 left-1 flex items-center">
            <button id="dropdownButton" className="rounded border border-transparent py-1 px-1.5 text-center flex items-center text-sm transition-all text-slate-600" onClick={toggleDropdown}>
              <span id="dropdownSpan" className="text-ellipsis overflow-hidden">{selectedItem}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {dropdownOpen && (
              <div id="dropdownMenu" ref={dropdownRef} className="min-w-[150px] overflow-hidden absolute left-0 w-full mt-10 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                <ul id="dropdownOptions">
                  <li className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-sm cursor-pointer" onClick={() => handleSelectItem('Category')}>Category</li>
                  <li className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-sm cursor-pointer" onClick={() => handleSelectItem('Yoga')}>Yoga</li>
                  <li className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-sm cursor-pointer" onClick={() => handleSelectItem('Weight Gain')}>Weight Gain</li>
                  <li className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-sm cursor-pointer" onClick={() => handleSelectItem('Weight Loss')}>Weight Loss</li>
                </ul>
              </div>
            )}
          </div>
          <input
            type="text"
            className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-28 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
            placeholder="Search exercises..."
          />
          <button
            className="absolute top-1 right-1 flex items-center rounded bg-red-600 py-1 px-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow focus:bg-red-700 focus:shadow-none active:bg-red-700 hover:bg-red-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5">
              <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
            </svg>
            Search
          </button>
        </div>
      </div>

      <Link to ='/exerciseDescription'>
      <div className="flex justify-center items-center gap-4 p-4">
      {exercises.map((exercise, index) => (
        <div key={index} className="flex  ml-7 pt-5">
          <div className="relative group overflow-hidden rounded-lg shadow-lg cursor-pointer w-72">
            <div className="absolute top-0 left-0 w-full transform -translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out z-10 bg-red-700 text-white p-3">
              <h2 className="text-xl text-black font-bold">Posted By: {exercise.name}</h2>
              <p className="text-base">{exercise.role}</p>
            </div>
            <div className="relative w-full pb-[120%] transform group-hover:translate-y-14 transition-transform duration-500 ease-in-out">
              <img src={exercise.image} alt={exercise.name} className="absolute inset-0 w-full h-full object-cover object-top"/>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-500 ease-in-out flex flex-col items-center justify-end pb-6">
              <button className="px-5 py-1.5 bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200 hover:bg-red-800 transform hover:scale-105 transition-all text-sm">
                Explore More
              </button>
            </div>
          </div>
        </div>
      ))}
      </div>
      </Link>
    </>
  )
}

export default ExerciseSection;
