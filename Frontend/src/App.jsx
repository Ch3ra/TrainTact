import { BrowserRouter, Route, Routes } from "react-router-dom"
import "./App.css"
import Landing from "./pages/Landing"
import TrainerRegister from "./form/TrainerRegister"
// import SelectionPage from "./pages/SelectionPage";
import Authentication from "./form/Authentication"
import OtpForm from "./form/OtpForm"
import ClientDash from "./pages/ClientDash"
import TrainerDash from "./pages/TrainerDash"
import AdminNavbar from "./AdminPages/AdminNavbar"
import TrainerRequest from "./AdminPages/TrainerRequest"
import EmailInput from "./form/ForgotPassword/EmailInput"
import ResetPassword from "./form/ForgotPassword/ResetPassword"
import Navbar from "./public/components/Navbar"
import UserProfile from "./pages/userPage/UserProfile"
import TrainerExplore from "./pages/userPage/TrainerExplore"
import AboutUs from "./pages/userPage/AboutUs"
import "@fortawesome/fontawesome-free/css/all.min.css"
import Card from "./public/components/Card"
import ExerciseSection from "./pages/userPage/ExerciseSection"
import ExerciseDescription from "./pages/userPage/ExerciseDescription"
import Pagination from "./public/components/Paginatiom"
import ClientProfileAdd from "./pages/clientPage/ClientProfileAdd"
import TrainerProfileAdd from "./pages/trainerPage/TrainerProfilkeAdd"
import ClientProfileEdit from "./pages/clientPage/ClientProfileEdit"
import TrainerProfileEdit from "./pages/trainerPage/TrainerProfileEdit"
import ClientRequest from "./pages/trainerPage/ClientRequest"
import TrainerNavbar from "./pages/trainerPage/TrainerNavbar"
import ClientDescription from "./pages/userPage/ClientDescription"
import TrainerDetails from "./pages/trainerPage/TrainerDetails"
import PaymentSuccess from "./pages/userPage/PaymentSuccess"
import Chat from "./pages/chat/Chat"
import Payment from "./pages/trainerPage/Payment/Payment"
import Success from "./pages/trainerPage/Payment/Success"
import Failure from "./pages/trainerPage/Payment/Failure"
import NotificationProvider from "./Notification/NotificationProvider"
import MyTrainer from "./pages/userPage/MyTrainer"
import MyClient from "./pages/userPage/MyClient"
import MyExercise from "./pages/userPage/Exercise/MyExercise"
import ExerciseForm from "./pages/userPage/Exercise/components/ExerciseForm"
import AllExercise from "./pages/userPage/Exercise/AllExercise"
import ExerciseEditForm from "./pages/userPage/Exercise/components/ExerciseEditForm"
import DashboardPage from "./AdminPages/dashboard/DashboardPage"
import TrainersPage from "./AdminPages/component/AllTrainer"
import TrainerRequestsPage from "./AdminPages/component/TrainerApproval"
import TrainersPage1, { AdminLayout } from "./AdminPages/component/AdminSidebar"
import UsersPage from "./AdminPages/component/User"
import Booking from "./AdminPages/component/Booking"
import PaymentDashboard from "./AdminPages/component/Payment"
import NotificationDashboard from "./AdminPages/component/Notification"
import Activity from "./AdminPages/component/Activity"
import ExerciseDashboard from "./AdminPages/component/ExerciseDashboard"
import TrainerLayout from "./TrainerPage/TrainerLayout"
import PaymentTransaction from "./TrainerPage/PaymentTransaction"
import RatingFeedback from "./TrainerPage/RatingFeedback"
import TrainerBooking from "./TrainerPage/TrainerBooking"
import TrainerProfile from "./TrainerPage/TrainerProfile"
import HomePage from "./UserPage/HomePage"
import TopRatedTrainer from "./UserPage/TopRatedTrainer"
import ClientProfile from "./UserPage/ClientProfile"
import TrainerDescription from "./UserPage/TrainerDescription"
import ExerciseDetail from "./UserPage/ExerciseDetails"



function App() {
  return (
    <>
      <BrowserRouter>
        <NotificationProvider>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/card" element={<Card />} />
          <Route path="/trainerExplore" element={<TrainerExplore />} /> 
          <Route path="/exercise" element={<ExerciseSection />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/emailInput" element={<EmailInput />} />
          <Route path="/enterNewPassword" element={<ResetPassword />} />
          <Route path="/exercise/:id" element={<ExerciseDescription />} />
          <Route path="/ratingfeedback" element={<RatingFeedback />} />
          <Route path="/chat" element={<Chat />} />


            {/* auth Paths */}
            <Route path="/registerTrainer" element={<TrainerRegister />} />
            <Route path="/Authentication" element={<Authentication />} />
            <Route path="/otpForm" element={<OtpForm />} />
            <Route path="/navbar" element={<Navbar />} />
            <Route path="/pagination" element={<Pagination />} />

            {/* Trainer Pannel Paths */}
            <Route path="/trainerDash" element={<TrainerDash />} />
            <Route path="/trainerLayout" element={<TrainerLayout />} />
            <Route path="/trainerNavbar" element={<TrainerNavbar />} />
            <Route path="/exerciseEditForm" element={<ExerciseEditForm/>} />
            <Route path="/myClient" element={<MyClient />} />
            <Route path="/exerciseForm" element={<ExerciseForm />} />
            <Route path="/myexercise" element={<MyExercise/>} />
            <Route path="/addTrainerProfile" element={<TrainerProfileAdd />} />
            <Route path="/editTrainerProfile" element={<TrainerProfileEdit />} />
            <Route path="/clientRequest" element={<ClientRequest />} />
            <Route path="/clientDescription/:id" element={<ClientDescription />} />

            <Route path="/paymentTransaction" element={<PaymentTransaction />} />
            <Route path="/trainerBooking" element={<TrainerBooking />} />
            
          

            {/* client Pannel Paths */}
            <Route path="/clientDash" element={<ClientDash />} />
            <Route path="/myTrainer" element={<MyTrainer />} />
            <Route path="/userProfile" element={<UserProfile />} />
            <Route path="/userProfile" element={<UserProfile />} />
            <Route path="/Allexercise" element={<AllExercise />} />
            <Route path="/addProfile" element={<ClientProfileAdd />} />
            <Route path="/editProfile" element={<ClientProfileEdit />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/trainerDetails/:id" element={<TrainerDetails />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/success" element={<Success />} />
            <Route path="/efailure" element={<Failure />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/toprated" element={<TopRatedTrainer />} />
            <Route path="/clientProfile" element={<ClientProfile/>} />
            <Route path="/trainerDescription" element={<TrainerDescription/>} />
            <Route path="/exercises/:id" element={<ExerciseDetail/>} />
            




          {/* Admin Pannel Paths */}
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/alltrainer" element={<TrainersPage />} />
            <Route path="/request" element={<TrainerRequestsPage />} />
            <Route path="/layout" element={<AdminLayout />} />
            <Route path="/user" element={<UsersPage />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/paymentdashboard" element={<PaymentDashboard />} />
            <Route path="/recent" element={<Activity />} />
            <Route path="/exerciseDashboard" element={<ExerciseDashboard />} />
            <Route path="/trainerProfile" element={<TrainerProfile />} />
            
            <Route path="/trainerRequest" element={<TrainersPage />} />
            <Route path="/adminNav" element={<AdminNavbar />} />      
            
          </Routes>
        </NotificationProvider>
      </BrowserRouter>
    </>
  )
}

export default App

