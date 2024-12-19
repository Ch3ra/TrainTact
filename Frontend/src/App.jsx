import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import TrainerRegister from "./form/TrainerRegister";
import SelectionPage from "./pages/SelectionPage";
import Authentication from "./form/Authentication";
import OtpForm from "./form/OtpForm";
import ClientDash from "./pages/ClientDash";
import TrainerDash from "./pages/TrainerDash";
import AdminNavbar from "./AdminPages/AdminNavbar";
import AdminDashboard from "./AdminPages/AdminDashboard";
import TrainerRequest from "./AdminPages/TrainerRequest";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          
        {/* auth Paths */}
          <Route path="/registerTrainer" element={<TrainerRegister/>} />
          <Route path="/Authentication" element={<Authentication/>} />
          <Route path="/selectionPage" element={<SelectionPage/>} />
          <Route path="/otpForm" element={<OtpForm/>} />

          <Route path="/" element={<Landing />} />
          <Route path="/adminDash" element={<AdminDashboard/>} />
          <Route path="/trainerRequest" element={<TrainerRequest/>} />
          <Route path="/adminNav" element={<AdminNavbar/>} />


          <Route path="/clientDash" element={<ClientDash/>} />
          <Route path="/trainerDash" element={<TrainerDash />} />


         

        </Routes>
      </BrowserRouter>

  
    </>
  );
}

export default App;
