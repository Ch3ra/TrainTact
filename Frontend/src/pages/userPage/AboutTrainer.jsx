import React from 'react';
import image1 from "../../assets/images/Image 16.svg";
import image2 from "../../assets/images/Image 15.svg";
import image3 from "../../assets/images/Image.svg";
import image4 from "../../assets/images/Image 17.svg";
import image5 from "../../assets/images/Image 21.svg";


const TrainerCard = ({ name, role, image }) => (
  <div className="group flex flex-col items-center transition-transform duration-300 hover:-translate-y-2">
    <div className="relative w-64 aspect-[4/5] mb-4 rounded-lg overflow-hidden shadow-md">
      <img 
        src={image} 
        alt={`${name} - ${role}`} 
        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-1">{name}</h3>
    <p className="text-red-600 font-semibold uppercase text-sm tracking-wider">{role}</p>
  </div>
);

const TrainerTeamGrid = ({ id }) => {
  const trainers = [
    {
      name: 'RIYA',
      role: 'CARDIO TRAINER',
      image: image1,
    },
    {
      name: 'HARI',
      role: 'BOXING TRAINER',
      image: image2,
    },
    {
      name: 'SHYAM',
      role: 'BODYBUILDING TRAINER',
      image: image3,
    },
    {
      name: 'ALISH',
      role: 'GYM TRAINER',
      image: image4,
    },
    {
      name: 'ALISHA',
      role: 'FITNESS TRAINER',
      image: image5,
    }
  ];

  return (
    <div id={id} className="trainer-team-grid w-full max-w-7xl mx-auto px-8 py-12">
      {/* Header Section */}
      <div className="mb-16">
        <h2 className="text-red-600 text-xl font-bold mb-4 uppercase tracking-wide">Our Trainer</h2>
        <div className="flex justify-between items-start gap-16">
          <div className="flex-1">
            <h3 className="text-5xl font-bold tracking-tight leading-tight">
              We have Expert<br />Team Members
            </h3>
          </div>
          <div className="flex-1 flex flex-col items-start">
            <p className="text-gray-600 mb-6 leading-relaxed">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
              Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, 
              when an unknown printer took a galley of type and scrambled it to make a type specimen book.
            </p>
            <button className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors duration-300 font-semibold">
              View All Trainers
            </button>
          </div>
        </div>
      </div>

      {/* Trainer Grid */}
      <div className="flex gap-8">
        {/* Left section - 2x2 grid */}
        <div className="grid grid-cols-2 gap-8">
          {/* First Row */}
          <TrainerCard {...trainers[0]} />
          <TrainerCard {...trainers[1]} />
          
          {/* Second Row */}
          <TrainerCard {...trainers[3]} />
          <TrainerCard {...trainers[4]} />
        </div>

        {/* Right section - Large image */}
        <div className="flex-1">
          <div className="group h-full rounded-lg overflow-hidden shadow-lg">
            <div className="relative h-[650px]">
              <img 
                src={trainers[2].image}
                alt={`${trainers[2].name} - ${trainers[2].role}`}
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="py-4 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{trainers[2].name}</h3>
              <p className="text-red-600 font-semibold uppercase text-sm tracking-wider">{trainers[2].role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerTeamGrid;