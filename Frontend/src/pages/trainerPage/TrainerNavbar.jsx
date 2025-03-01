import React from 'react';
import { Bell, Mail, UserCircle } from 'lucide-react';
import { Link} from "react-router-dom";

const TrainerNavbar = () => {
  return (
    <div className="  bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white shadow">
        <h1 className="text-2xl font-bold text-red-600">TrainTact</h1>
        <div className="flex items-center gap-4">
          <Bell className="h-6 w-6 hover:text-red-600 cursor-pointer" />
          <Link to='/chat'><Mail className="h-6 w-6 hover:text-red-600 cursor-pointer" /></Link>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            <img
              src="https://cdni.iconscout.com/illustration/premium/thumb/female-user-image-illustration-download-in-svg-png-gif-file-formats--person-girl-business-pack-illustrations-6515859.png?f=webp"
              alt="Profile"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </header>

      
    </div>
  );
};

export default TrainerNavbar;
