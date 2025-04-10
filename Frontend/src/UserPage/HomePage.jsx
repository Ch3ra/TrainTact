"use client"

import { useEffect, useState } from "react"

import { ArrowRight, User, Dumbbell, Calendar } from "lucide-react"
import { Link } from "react-router-dom"
import TopRatedTrainer from "./TopRatedTrainer"
import HowItWorks from "./HowItWorks"
import Footers from "./Footer"
import Footer from "../public/components/Footer"
import WhyChooseTrainTact from "./WhyChooseTT"
import Navbar from "../public/components/Navbar"

const HomePage = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  useEffect(() => {
    // Preload the video
    const video = document.getElementById("bg-video")
    if (video) {
      video.addEventListener("loadeddata", () => {
        setIsVideoLoaded(true)
      })
    }

    // Cleanup
    return () => {
      if (video) {
        video.removeEventListener("loadeddata", () => {
          setIsVideoLoaded(true)
        })
      }
    }
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar/>
      {/* Hero Section with Background Video */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full bg-black">
          <div className={`transition-opacity duration-1000 ${isVideoLoaded ? "opacity-70" : "opacity-0"}`}>
            <video
              id="bg-video"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 min-w-full min-h-full object-cover"
            >
              <source
                src="https://videos.pexels.com/video-files/4438071/4438071-hd_1920_1080_25fps.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
          {/* Fallback background while video loads */}
          <div
            className={`absolute inset-0 bg-gradient-to-r from-black to-gray-800 transition-opacity duration-1000 ${isVideoLoaded ? "opacity-0" : "opacity-100"}`}
          ></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Find Your Perfect <span className="text-[#CE0000]">Trainer</span> Today
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Connect with professional trainers tailored to your fitness goals and preferences
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/trainerExplore"
              className="bg-[#CE0000] hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Find a Trainer <ArrowRight size={18} />
            </Link>
            <Link
              href="/exercise"
              className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Explore Exercises <Dumbbell size={18} />
            </Link>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 mt-4 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-1 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>
    <WhyChooseTrainTact/>



     
<TopRatedTrainer/>
<HowItWorks/>
<Footer/>
   
    </div>
  )
}




export default HomePage

