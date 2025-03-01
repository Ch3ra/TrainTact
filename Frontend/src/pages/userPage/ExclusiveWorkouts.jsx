import React from "react";

import image1 from "../../assets/images/Image 16.svg";
import image2 from "../../assets/images/Image 15.svg";
import image3 from "../../assets/images/Image.svg";
import image4 from "../../assets/images/Image 17.svg";
import image5 from "../../assets/images/Image 21.svg";
import image6 from "../../assets/images/Image 19.svg";

const ExclusiveWorkouts = ({id}) => {
  const workouts = [
    {
      id: 1,
      title: "The Knockout Workouts",
      image: image1,
    },
    {
      id: 2,
      title: "Cardio Training Session",
      image: image2,
    },
    {
      id: 3,
      title: "Bodybuilding Training Session",
      image: image3,
    },
    {
      id: 4,
      title: "Psychology of Training",
      image: image4,
    },
    {
      id: 5,
      title: "Practical Self Defence",
      image: image5,
    },
    {
      id: 6,
      title: "Fitness Training For Man",
      image: image6,
    },
  ];

  return (
    <div id={id} className="exclusive-workouts bg-white py-12 px-6 md:px-16 lg:px-24">
      {/* Title Section */}
      <div className="text-left mb-8">
        <h4 className="text-red-600 uppercase font-bold text-sm tracking-widest">
          Find Your Exercise
        </h4>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">
          New Exclusive Workouts
        </h2>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {workouts.map((workout, index) => (
          <div
            key={workout.id}
            className="relative h-[400px] rounded-lg shadow-lg group cursor-pointer overflow-hidden"
          >
            {/* Image Container */}
            <div className="absolute inset-0">
              <img
                src={workout.image}
                alt={workout.title}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-110"
              />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-90" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
              {/* Workout Number */}
              <h3 className="text-white font-teko text-[40px] font-semibold leading-none mb-2 opacity-90">
                {`0${index + 1}`}
              </h3>

              {/* Workout Title */}
              <h4 className="text-white text-xl font-bold transform translate-y-0 transition-transform duration-300 group-hover:translate-y-[-4px]">
                {workout.title}
              </h4>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExclusiveWorkouts;