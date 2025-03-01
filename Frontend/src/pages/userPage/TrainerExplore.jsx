import React from 'react';
import Navbar from '../../public/components/Navbar';
import SearchBar from '../../form/searchbar/SearchBar';
import Card from '../../public/components/Card';
import pic1 from "../../assets/images/pic1.jpg";
import pic2 from "../../assets/images/pic2.jpg";
import pic3 from "../../assets/images/pic3.jpg";
import { Link } from 'react-router-dom';

const TrainerExplore = () => {
  const trainers = [
    {
      name: "WILLIAM DIXON",
      role: "BODYBUILDING COACH",
      image: pic1
    },
    {
      name: "ALISH BAN",
      role: "WEIGHT GAIN",
      image: pic2
    },
    {
      name: "ROJESH GIRI",
      role: "WEIGHT LOSS",
      image: pic3
    }
  ];

  return (
    <>
      <Navbar />
      <div className='flex flex-col space-y-6'>
        <SearchBar />
        <Link to ='/trainerDescription'>
        <div className="flex  gap-6  px-4">
          {trainers.map((trainer, index) => (
            <Card
              key={index}
              name={trainer.name}
              role={trainer.role}
              image={trainer.image}
            />
          ))}
        </div>
        </Link>
      </div>
    </>
  );
};

export default TrainerExplore;