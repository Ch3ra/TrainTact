import React from "react";
import touch from "../../assets/images/d-2.png";
const AboutTouchSection = () => {
    return (
        <div className="w-full min-h-screen bg-gray-200 flex items-center justify-center">
            <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-8 gap-20">
                {/* Left Image Section */}
                <div className="w-full md:w-[400px]">
                    <div className="w-full  rounded-lg overflow-hidden">
                        <img 
                            src={touch}
                            alt="Fitness Trainer" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Right Text Section */}
                <div className="w-full md:w-1/2">
                    <h1 className="text-[48px] md:text-[46px] font-bold leading-tight">
                        <span className="block   w-fit">
                            We Are Ready To
                        </span>
                        <span className="block w-fit">
                            Help You To Get
                        </span>
                        <span className="block">
                            Perfect Fitness!
                        </span>
                    </h1>
                    <button className="mt-8 px-8 py-3 bg-red-600 text-white text-lg font-medium rounded-lg hover:bg-red-700 transition-colors">
                        Get in Touch
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutTouchSection;