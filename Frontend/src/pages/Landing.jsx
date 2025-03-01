import React, { useState, useEffect } from "react";

import bgImage from "../assets/images/Rectangle 2.jpg";
import women from "../assets/images/image 3.svg";
import d2 from "../assets/images/d-3.png";
import d3 from "../assets/images/d-2.png";
import Navbar from "../public/components/Navbar";
import AboutUsSection from "./userPage/AboutUsSection";
import ExclusiveWorkouts from "./userPage/ExclusiveWorkouts";

import TrainerTeamGrid from "./userPage/AboutTrainer";
import AboutTouchSection from "./userPage/AboutTouchSection";
import Footer from "../public/components/Footer";


const Landing = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Array of images for the slider
  const images = [women, d2,d3];

  const handleNext = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentImageIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrev = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? images.length - 1 : prevIndex - 1
      );
    }
  };

  // Reset the transition state after animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentImageIndex]);

  return (
    <>
    <div>
      {/* Navbar */}
      <Navbar />

      {/* Landing Page Hero Section */}
      <div id="heroSection"
        className=" hero-Section relative bg-cover bg-center h-[80vh]"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-30"></div>

        {/* Translucent Rectangle */}
        <div className="absolute inset-0 bg-white bg-opacity-60 z-5 w-full h-full"></div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center h-full px-8 md:px-16">
          {/* Left Content */}
          <div className="text-black max-w-lg ml-7">
            <h3 className="text-red-600 text-lg font-semibold tracking-widest">
              HEALTH
            </h3>
            <h1 className="text-4xl md:text-4xl font-extrabold leading-snug mt-4">
              GROW <br />
              YOUR STRENGTH
            </h1>
            <button
              className="mt-6 w-[194px] h-[50px] bg-[#CE0000] text-white text-lg font-semibold rounded-[10px] border-2 border-[#CE0000] border-opacity-25 shadow-lg hover:bg-[#B00000] transition"
            >
              Hire Coach
            </button>
          </div>

          {/* Right Image */}
          <div className="relative mt-12 md:mt-16 w-[600px] h-[400px]">
            <div className="relative overflow-hidden w-full h-full">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentImageIndex * 100}%)`,
                }}
              >
                {images.map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt={`Fitness Coach ${index + 1}`}
                    className="w-full h-full object-cover flex-shrink-0"
                    style={{
                      width: "600px", // Decreased width
                      height: "400px", // Decreased height
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Slider Navigation */}
            <div className="absolute inset-y-1/2 left-4 flex items-center">
              <button
                onClick={handlePrev}
                disabled={isTransitioning}
                className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                &#8249;
              </button>
            </div>
            <div className="absolute inset-y-1/2 right-4 flex items-center">
              <button
                onClick={handleNext}
                disabled={isTransitioning}
                className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                &#8250;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* <FitnessFacts/> */}
    < AboutUsSection id="aboutUsSection"/>
    <ExclusiveWorkouts id="exerciseSection" />
    <TrainerTeamGrid id="trainerSection"/>
    <AboutTouchSection/>
    <Footer/>
    </>
  );
};

export default Landing;
