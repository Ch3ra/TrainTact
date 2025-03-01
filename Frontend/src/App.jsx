import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import TrainerRegister from "./form/TrainerRegister";
// import SelectionPage from "./pages/SelectionPage";
import Authentication from "./form/Authentication";
import OtpForm from "./form/OtpForm";
import ClientDash from "./pages/ClientDash";
import TrainerDash from "./pages/TrainerDash";
import AdminNavbar from "./AdminPages/AdminNavbar";
import AdminDashboard from "./AdminPages/AdminDashboard";
import TrainerRequest from "./AdminPages/TrainerRequest";
import EmailInput from "./form/ForgotPassword/EmailInput";
import ResetPassword from "./form/ForgotPassword/ResetPassword";
import Navbar from "./public/components/Navbar";
import UserProfile from "./pages/userPage/UserProfile";
import TrainerExplore from "./pages/userPage/TrainerExplore";
import AboutUs from "./pages/userPage/AboutUs";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Card from "./public/components/Card";
import ExerciseSection from "./pages/userPage/ExerciseSection";
import ExerciseDescription from "./pages/userPage/ExerciseDescription";

import Pagination from "./public/components/Paginatiom";
import ClientProfileAdd from "./pages/clientPage/ClientProfileAdd";

import TrainerProfileAdd from "./pages/trainerPage/TrainerProfilkeAdd";
import ClientProfileEdit from "./pages/clientPage/ClientProfileEdit";
import TrainerProfileEdit from "./pages/trainerPage/TrainerProfileEdit";
import ClientRequest from "./pages/trainerPage/ClientRequest";
import TrainerNavbar from "./pages/trainerPage/TrainerNavbar";
import ClientDescription from "./pages/userPage/ClientDescription";

import TrainerDetails from "./pages/trainerPage/TrainerDetails";
import PaymentSuccess from "./pages/userPage/PaymentSuccess";
import Chat from "./pages/chat/Chat";






function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          
        {/* auth Paths */}
          <Route path="/registerTrainer" element={<TrainerRegister/>} />
          <Route path="/Authentication" element={<Authentication/>} />
          {/* <Route path="/selectionPage" element={<SelectionPage/>} /> */}
          <Route path="/otpForm" element={<OtpForm/>} />
          <Route path="/navbar" element={<Navbar/>} />
          <Route path="/pagination" element={<Pagination />} />

          <Route path="/" element={<Landing />} />
          <Route path="/adminDash" element={<AdminDashboard/>} />
          <Route path="/trainerRequest" element={<TrainerRequest/>} />
          <Route path="/adminNav" element={<AdminNavbar/>} />


          <Route path="/clientDash" element={<ClientDash/>} />
          <Route path="/card" element={<Card/>} />
          <Route path="/trainerDash" element={<TrainerDash />} />


          {/* UserDashboard */}
          <Route path="/userProfile" element={<UserProfile/>} />
          <Route path="/trainerExplore" element={<TrainerExplore/>} />
          <Route path="/exercise" element={<ExerciseSection/>} />
          <Route path="/AboutUs" element={<AboutUs/>} />
          <Route path="/exerciseDescription" element={<ExerciseDescription/>} />
        
          <Route path="/userProfile" element={<UserProfile />} />
          <Route path="/addProfile" element={<ClientProfileAdd />} />
          <Route path="/editProfile" element={<ClientProfileEdit />} />
          <Route path="/clientDescription/:id" element={<ClientDescription />} />
          <Route path="/success" element={<PaymentSuccess />} />

          <Route path="/trainerDetails/:id" element={<TrainerDetails />} />

          <Route path="/trainerNavbar" element={<TrainerNavbar />} />
          <Route path="/addTrainerProfile" element={<TrainerProfileAdd />} />
          <Route path="/editTrainerProfile" element={<TrainerProfileEdit />} />
          <Route path="/clientRequest" element={<ClientRequest />} />
          <Route path="/chat" element={<Chat/>} />

          

        {/* ForgotPassword */}
        <Route path="/emailInput" element={<EmailInput/>} />
        <Route path="/enterNewPassword" element={<ResetPassword/>} />

         

        </Routes>
      </BrowserRouter>

  
    </>
  );
}

export default App;
