"use client"

import { useState } from "react"
import {
  Calendar,
  Clock,
  DollarSign,
  Award,
  Star,
  StarHalf,
  MessageCircle,
  ThumbsUp,
  Share2,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react"
import Navbar from "../public/components/Navbar"

const TrainerDescription = ({ trainerId }) => {
  const [showAllReviews, setShowAllReviews] = useState(false)

  // Mock data - in a real app, you would fetch this data based on trainerId
  const trainer = {
    name: "Sarah Johnson",
    yearsOfExperience: 8,
    bibliography: "Certified Personal Trainer (CPT), Nutrition Specialist",
    price: 45,
    availabilityHours: "morning",
    description:
      "I'm passionate about helping clients achieve their fitness goals through personalized training programs. With 8 years of experience, I specialize in strength training, weight loss, and nutritional guidance. My approach focuses on sustainable lifestyle changes rather than quick fixes. I believe fitness should be enjoyable and adaptable to your unique needs and schedule.",
    startDay: "monday",
    endDay: "friday",
    coverPhoto: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
    profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
    resume: "https://example.com/resume.pdf",
    advancedNeeded: false,
    specialties: ["Strength Training", "Weight Loss", "Nutrition", "HIIT"],
    rating: 4.8,
    totalReviews: 47,
    availability: {
      monday: ["7:00 AM - 11:00 AM", "5:00 PM - 8:00 PM"],
      tuesday: ["7:00 AM - 11:00 AM", "5:00 PM - 8:00 PM"],
      wednesday: ["7:00 AM - 11:00 AM"],
      thursday: ["7:00 AM - 11:00 AM", "5:00 PM - 8:00 PM"],
      friday: ["7:00 AM - 11:00 AM"],
    },
  }

  // Mock reviews with profile images
  const reviews = [
    {
      id: 1,
      user: "Michael P.",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      rating: 5,
      date: "2 weeks ago",
      comment:
        "Sarah is an amazing trainer! She helped me lose 15 pounds in 3 months with a customized workout plan and nutrition advice. She's always punctual and motivating during our sessions.",
      likes: 12,
    },
    {
      id: 2,
      user: "Jennifer L.",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      rating: 5,
      date: "1 month ago",
      comment:
        "I've been working with Sarah for 6 months now and the results are incredible. She knows exactly how to push me without overdoing it. Her nutrition tips have been game-changing for my energy levels.",
      likes: 8,
    },
    {
      id: 3,
      user: "David K.",
      avatar: "https://randomuser.me/api/portraits/men/62.jpg",
      rating: 4,
      date: "2 months ago",
      comment:
        "Great trainer who really knows her stuff. Very professional and attentive to form. The only reason for 4 stars instead of 5 is sometimes our sessions start a few minutes late.",
      likes: 3,
    },
    {
      id: 4,
      user: "Rebecca T.",
      avatar: "https://randomuser.me/api/portraits/women/29.jpg",
      rating: 5,
      date: "3 months ago",
      comment:
        "Sarah has transformed my approach to fitness. As someone who always hated the gym, she's made working out something I actually look forward to. Her positive energy is contagious!",
      likes: 15,
    },
    {
      id: 5,
      user: "Thomas B.",
      avatar: "https://randomuser.me/api/portraits/men/15.jpg",
      rating: 4,
      date: "3 months ago",
      comment:
        "Very knowledgeable trainer. Helped me work around my knee injury while still getting effective workouts. Would recommend to anyone looking for a trainer who listens to your needs.",
      likes: 7,
    },
  ]

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-yellow-400 text-yellow-400 w-5 h-5" />)
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="fill-yellow-400 text-yellow-400 w-5 h-5" />)
    }

    const emptyStars = 5 - stars.length
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300 w-5 h-5" />)
    }

    return stars
  }

  // Format availability days
  const formatDayRange = () => {
    const days = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    }

    return `${days[trainer.startDay]} - ${days[trainer.endDay]}`
  }

  // Format availability hours
  const formatAvailabilityHours = () => {
    const hours = {
      morning: "Morning (6 AM - 12 PM)",
      "mid-day": "Mid-day (12 PM - 3 PM)",
      afternoon: "Afternoon (3 PM - 6 PM)",
      evening: "Evening (6 PM - 9 PM)",
      night: "Night (9 PM - 12 AM)",
    }

    return hours[trainer.availabilityHours]
  }

  // Display all reviews or just the first 3
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  return (
    <>
     <Navbar/>
    <div className="max-w-6xl mt-10 mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Cover Photo with Profile Picture */}
     
      <div className="relative h-64 md:h-80 w-full">
        <img
          src={trainer.coverPhoto || "/placeholder.svg"}
          alt={`${trainer.name} cover`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-6 md:left-8">
          <div className="relative">
            <img
              src={trainer.profilePhoto || "/placeholder.svg"}
              alt={`${trainer.name}`}
              className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
            />
          </div>
        </div>

        {/* Trainer Name and Rating */}
        <div className="absolute bottom-0 left-44 md:left-48 p-6 text-white">
          <h1 className="text-3xl font-bold">{trainer.name}</h1>
          <div className="flex items-center mt-2">
            {renderStars(trainer.rating)}
            <span className="ml-2 text-white font-medium">{trainer.rating}</span>
            <span className="ml-2 text-white/80">({trainer.totalReviews} reviews)</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 mt-16">
        {/* Left Column - Trainer Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg flex flex-col items-center justify-center">
              <Award className="text-[#CE0000] mb-2" />
              <p className="text-sm text-gray-500">Experience</p>
              <p className="font-semibold">{trainer.yearsOfExperience} Years</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg flex flex-col items-center justify-center">
              <DollarSign className="text-[#CE0000] mb-2" />
              <p className="text-sm text-gray-500">Session Price</p>
              <p className="font-semibold">${trainer.price}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg flex flex-col items-center justify-center col-span-2 md:col-span-1">
              <Clock className="text-[#CE0000] mb-2" />
              <p className="text-sm text-gray-500">Availability</p>
              <p className="font-semibold">{formatAvailabilityHours()}</p>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-800">About</h2>
            <p className="text-gray-700 leading-relaxed">{trainer.description}</p>
          </div>

          {/* Specialties */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-800">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {trainer.specialties.map((specialty, index) => (
                <span key={index} className="bg-red-50 text-[#CE0000] px-3 py-1 rounded-full text-sm">
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          {/* Detailed Schedule */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-800">Weekly Schedule</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(trainer.availability).map(([day, times]) => (
                  <div key={day} className="flex items-start space-x-3">
                    <Calendar className="text-[#CE0000] mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="font-medium capitalize">{day}</p>
                      <div className="text-sm text-gray-600">
                        {times.map((time, index) => (
                          <p key={index}>{time}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Credentials */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-800">Credentials</h2>
            <p className="text-gray-700">{trainer.bibliography}</p>
            {trainer.resume && (
              <a
                href={trainer.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-[#CE0000] hover:text-red-700 font-medium"
              >
                View Resume
              </a>
            )}
          </div>
        </div>

        {/* Right Column - Reviews and Booking */}
        <div className="space-y-6">
          {/* Booking Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Book a Session</h2>
            <p className="text-gray-700 mb-4">Available {formatDayRange()}</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">
              ${trainer.price} <span className="text-sm font-normal text-gray-500">/ hour</span>
            </p>
            <button className="w-full bg-[#CE0000] hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200">
              Book Now
            </button>
            <button className="w-full mt-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center">
              <MessageCircle className="mr-2" size={18} />
              Message Trainer
            </button>
          </div>

          {/* Reviews Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Reviews</h2>
              <div className="flex items-center">
                {renderStars(trainer.rating)}
                <span className="ml-2 font-medium">{trainer.rating}</span>
              </div>
            </div>

            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {review.avatar ? (
                        <img
                          src={review.avatar || "/placeholder.svg"}
                          alt={review.user}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="text-gray-500" size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{review.user}</h4>
                        <span className="text-sm text-gray-500">{review.date}</span>
                      </div>
                      <div className="flex items-center my-1">{renderStars(review.rating)}</div>
                      <p className="text-gray-700 text-sm mt-1">{review.comment}</p>
                      <div className="flex items-center mt-2">
                        <button className="flex items-center text-sm text-gray-500 hover:text-[#CE0000]">
                          <ThumbsUp size={14} className="mr-1" />
                          Helpful ({review.likes})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {reviews.length > 3 && (
                <button
                  className="text-[#CE0000] hover:text-red-700 font-medium flex items-center"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? (
                    <>
                      Show Less <ChevronUp size={16} className="ml-1" />
                    </>
                  ) : (
                    <>
                      View All {trainer.totalReviews} Reviews <ChevronDown size={16} className="ml-1" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Share Profile */}
          <div className="flex justify-center">
            <button className="text-gray-600 hover:text-[#CE0000] flex items-center text-sm font-medium">
              <Share2 size={16} className="mr-1" />
              Share Trainer Profile
            </button>
          </div>
        </div>
      </div>
    </div></>
  )
}

export default TrainerDescription

