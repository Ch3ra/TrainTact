import React from 'react';
import Navbar from '../../public/components/Navbar';
import aboutus from "../../assets/images/AboutUs.mp4";
import AboutUsSection from './AboutUsSection';

const AboutUs = () => {
  return (
    <>
      <Navbar/>
      <div className="relative w-full h-[400px] overflow-hidden">
        <video autoPlay loop muted className="absolute z-10 w-full h-[400px] object-cover">
          <source src={aboutus} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className='mt-2'>
      < AboutUsSection/></div>
    </>
  )
}

export default AboutUs;
