import React from "react";
import image from "../../assets/images/Image1.png"; // Replace with your image path

const AboutUsSection = ({ id }) => {
  return (
    <div id={id} className="about-us-section flex flex-col md:flex-row items-center bg-white py-12 px-6 md:px-16 lg:px-24">
      {/* Left Section: Image */}
      <div className="relative w-full md:w-1/2 flex justify-center items-center">
        <div className="bg-red-600 w-[90%] h-[90%] absolute top-4 left-4 rounded-lg"></div>
        <img
          src={image}
          alt="Muscle Man"
          className="relative w-full h-auto max-w-md md:max-w-full rounded-lg shadow-md z-10"
        />
      </div>

      {/* Right Section: Content */}
      <div className="w-full md:w-1/2 mt-8 md:mt-0 md:ml-12">
        <h4 className="text-red-600 uppercase font-bold text-sm tracking-widest mb-4">
          About Us
        </h4>
        <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6">
          Give A Shape of <br />
          Your Body
        </h2>
        <p className="text-gray-600 text-base leading-relaxed mb-6">
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text
          ever since the 1500s.
        </p>

        {/* Feature List */}
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-600 text-white flex items-center justify-center rounded-full mr-4">
              {/* Replace with your icon */}
              <i className="fas fa-dumbbell text-lg"></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold">Full-Body Strength</h5>
              <p className="text-gray-600 text-sm">
                Train with the best experts in bodybuilding field.
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-600 text-white flex items-center justify-center rounded-full mr-4">
              {/* Replace with your icon */}
              <i className="fas fa-cogs text-lg"></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold">Lean Machines</h5>
              <p className="text-gray-600 text-sm">
                Our personal trainers will help you find a perfect workout.
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-600 text-white flex items-center justify-center rounded-full mr-4">
              {/* Replace with your icon */}
              <i className="fas fa-child text-lg"></i>
            </div>
            <div>
              <h5 className="text-lg font-semibold">Power Yoga</h5>
              <p className="text-gray-600 text-sm">
                Uniquely sequenced class work to heat and challenge the body.
              </p>
            </div>
          </div>
        </div>

        {/* Learn More Button */}
        <button className="mt-8 px-8 py-3 bg-red-600 text-white text-lg font-semibold rounded shadow-md hover:bg-red-700 transition">
          Learn More
        </button>
      </div>
    </div>
  );
};

export default AboutUsSection;
