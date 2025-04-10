

import { useState } from "react"
import {
  MapPin,
  Target,
  Weight,
  Ruler,
  Activity,
  Calendar,
  Clock,
  CheckCircle,
  DollarSign,
  User,
  ArrowRight,
} from "lucide-react"
import Navbar from "../public/components/Navbar"

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [expandedDays, setExpandedDays] = useState({})

  // Toggle day expansion
  const toggleDayExpansion = (programId, dayNumber) => {
    setExpandedDays((prev) => {
      const key = `${programId}-${dayNumber}`
      return { ...prev, [key]: !prev[key] }
    })
  }

  // Sample workout program data
  const currentProgram = {
    _id: "wp1",
    name: "Build Muscle & Strength",
    trainer: {
      _id: "tr1",
      name: "Sarah Johnson",
      specialty: "Weight Loss Specialist",
      photo: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    startDate: "2025-04-01",
    endDate: "2025-04-07",
    progress: 57, // percentage
    days: [
      {
        dayNumber: 1,
        completed: true,
        activities:
          "Chest & Triceps: 4 sets of bench press (8-10 reps), 3 sets of incline dumbbell press (10-12 reps), 3 sets of chest flyes (12-15 reps), 3 sets of tricep pushdowns (12-15 reps), 3 sets of overhead tricep extensions (10-12 reps)",
      },
      {
        dayNumber: 2,
        completed: true,
        activities:
          "Back & Biceps: 4 sets of deadlifts (6-8 reps), 3 sets of pull-ups (8-10 reps), 3 sets of barbell rows (8-10 reps), 3 sets of barbell curls (10-12 reps), 3 sets of hammer curls (12-15 reps)",
      },
      {
        dayNumber: 3,
        completed: true,
        activities: "Rest day or light cardio (20-30 minutes)",
      },
      {
        dayNumber: 4,
        completed: true,
        activities:
          "Shoulders & Abs: 4 sets of overhead press (8-10 reps), 3 sets of lateral raises (12-15 reps), 3 sets of face pulls (15-20 reps), 3 sets of planks (30-60 seconds), 3 sets of hanging leg raises (10-15 reps)",
      },
      {
        dayNumber: 5,
        completed: false,
        activities:
          "Legs: 4 sets of squats (8-10 reps), 3 sets of leg press (10-12 reps), 3 sets of Romanian deadlifts (8-10 reps), 3 sets of leg extensions (12-15 reps), 3 sets of leg curls (12-15 reps)",
      },
      {
        dayNumber: 6,
        completed: false,
        activities:
          "Arms & Abs: 3 sets of close-grip bench press (8-10 reps), 3 sets of skull crushers (10-12 reps), 3 sets of preacher curls (10-12 reps), 3 sets of concentration curls (12-15 reps), 3 sets of cable crunches (15-20 reps), 3 sets of Russian twists (20 reps)",
      },
      {
        dayNumber: 7,
        completed: false,
        activities: "Complete rest day",
      },
    ],
    cardPhoto: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=2070&auto=format&fit=crop",
    createdAt: "2025-03-28T14:30:00Z",
  }

  // Sample past programs
  const pastPrograms = [
    {
      _id: "wp2",
      name: "Fat Loss & Conditioning",
      trainer: {
        _id: "tr2",
        name: "David Kim",
        specialty: "HIIT Specialist",
        photo: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      startDate: "2025-03-15",
      endDate: "2025-03-21",
      completed: true,
      cardPhoto: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?q=80&w=2069&auto=format&fit=crop",
      createdAt: "2025-03-10T09:15:00Z",
    },
    {
      _id: "wp3",
      name: "Functional Fitness",
      trainer: {
        _id: "tr3",
        name: "Emma Rodriguez",
        specialty: "Functional Training",
        photo: "https://randomuser.me/api/portraits/women/68.jpg",
      },
      startDate: "2025-02-20",
      endDate: "2025-02-26",
      completed: true,
      cardPhoto: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop",
      createdAt: "2025-02-15T11:45:00Z",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your existing Navbar will be imported and used here */}
      <Navbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Profile Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Client Profile</h2>
                  <p className="text-gray-500">Personal information</p>
                </div>
                <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Edit Profile
                </button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 bg-gray-100 rounded-full mb-4 overflow-hidden">
                  <img
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt="Profile picture"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">John Smith</h3>
                <p className="text-gray-500">john.smith@example.com</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Age: 32 years</span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">New York, NY</span>
                </div>

                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Goal: Weight loss and muscle toning</span>
                </div>

                <div className="flex items-center gap-3">
                  <Weight className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Weight: 85 kg</span>
                </div>

                <div className="flex items-center gap-3">
                  <Ruler className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Height: 180 cm</span>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Fitness Level: Intermediate</span>
                </div>
              </div>

              

              {/* Current Workout Program Card */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-700 mb-4">Current Workout Program</h4>
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <div className="h-40 relative">
                    <img
                      src={currentProgram.cardPhoto || "/placeholder.svg"}
                      alt={currentProgram.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <h3 className="text-white font-bold text-lg">{currentProgram.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                          <div
                            className="bg-white h-1.5 rounded-full"
                            style={{ width: `${currentProgram.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-xs">{currentProgram.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={currentProgram.trainer.photo || "/placeholder.svg"}
                          alt={currentProgram.trainer.name}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                        <span className="text-sm text-gray-600">Added by {currentProgram.trainer.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(currentProgram.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <button className="mt-2 w-full text-[#CE0000] hover:text-[#b00000] text-sm font-medium flex items-center justify-center">
                      View Program <ArrowRight className="ml-1 w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trainer Information Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Trainer</h2>
              <p className="text-gray-500 mb-6">Current assigned trainer</p>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Trainer profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sarah Johnson</h3>
                  <p className="text-gray-600">Certified personal trainer with specialization in weight loss</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Experience</h4>
                  <p className="text-lg font-semibold">5 years</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Rate</h4>
                  <p className="text-lg font-semibold">$50/hour</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Availability</h4>
                  <p className="text-lg font-semibold">Monday - Friday</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Preferred Hours</h4>
                  <p className="text-lg font-semibold">Morning</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Message Trainer
                </button>
                <button className="flex-1 px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                 View Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">Your Training Sessions</h2>
            <p className="text-gray-500">Manage your upcoming and past sessions</p>
          </div>

          <div className="w-full">
            <div className="px-6 pt-4">
              <div className="grid w-full grid-cols-2 mb-4 border rounded-md overflow-hidden">
                <button
                  className={`py-2 text-center transition-colors ${
                    activeTab === "upcoming"
                      ? "bg-[#CE0000] text-white font-medium"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab("upcoming")}
                >
                  Upcoming Sessions
                </button>
                <button
                  className={`py-2 text-center transition-colors ${
                    activeTab === "completed"
                      ? "bg-[#CE0000] text-white font-medium"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab("completed")}
                >
                  Completed Sessions
                </button>
              </div>
            </div>

            {activeTab === "upcoming" && (
              <div className="p-6 pt-2">
                <div className="space-y-6">
                  {/* Session 1 - Enhanced with better styling */}
                  <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-5">
                      <div className="flex flex-wrap items-center justify-between mb-4">
                        <div className="flex items-center gap-2 mb-2 sm:mb-0">
                          <span className="bg-[#CE0000] text-white text-xs font-medium px-2.5 py-1 rounded">
                            Upcoming
                          </span>
                          <span className="text-gray-500 text-sm">BOOK-00001</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm">Payment Status</span>
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="font-medium text-sm">Paid</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="hidden sm:block">
                          <div className="w-12 h-12 bg-[#CE0000] rounded-full flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Session with Sarah Johnson</h3>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                              <Calendar className="w-5 h-5 text-[#CE0000]" />
                              <span className="text-gray-700">Thu, Apr 10, 2025</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                              <Clock className="w-5 h-5 text-[#CE0000]" />
                              <span className="text-gray-700">09:00 (60 min)</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                              <DollarSign className="w-5 h-5 text-[#CE0000]" />
                              <span className="text-gray-700">50</span>
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-lg mb-4 border border-gray-100">
                            <h4 className="font-medium text-gray-700 mb-1">Session Notes:</h4>
                            <p className="text-gray-600">Focus on upper body strength</p>
                          </div>

                          <div className="flex justify-end">
                            <button className="px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                              Join Session
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session 2 - Enhanced with better styling */}
                  <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-5">
                      <div className="flex flex-wrap items-center justify-between mb-4">
                        <div className="flex items-center gap-2 mb-2 sm:mb-0">
                          <span className="bg-[#CE0000] text-white text-xs font-medium px-2.5 py-1 rounded">
                            Upcoming
                          </span>
                          <span className="text-gray-500 text-sm">BOOK-00002</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm">Payment Status</span>
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="font-medium text-sm">Paid</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="hidden sm:block">
                          <div className="w-12 h-12 bg-[#CE0000] rounded-full flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Session with Sarah Johnson</h3>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                              <Calendar className="w-5 h-5 text-[#CE0000]" />
                              <span className="text-gray-700">Tue, Apr 15, 2025</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                              <Clock className="w-5 h-5 text-[#CE0000]" />
                              <span className="text-gray-700">09:00 (60 min)</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-100">
                              <DollarSign className="w-5 h-5 text-[#CE0000]" />
                              <span className="text-gray-700">50</span>
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-lg mb-4 border border-gray-100">
                            <h4 className="font-medium text-gray-700 mb-1">Session Notes:</h4>
                            <p className="text-gray-600">Cardio and core workout</p>
                          </div>

                          <div className="flex justify-end">
                            <button className="px-4 py-2 bg-[#CE0000] hover:bg-[#b00000] text-white rounded-md text-sm font-medium transition-colors">
                              Join Session
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "completed" && (
              <div className="p-6 pt-2">
                <div className="text-center py-8 text-gray-500">
                  <p>No completed sessions yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientDashboard

