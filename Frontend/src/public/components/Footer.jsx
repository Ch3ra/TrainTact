import React from "react";
import logo from "./../../assets/images/l-1.png";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-300 py-8 px-4">
      <div className="flex text-center space-x-0 justify-center">
        <Link to="/" className="inline-flex items-center justify-center">
          <img
            src={logo}
            className="h-48 w-48 object-contain transition-transform duration-300 hover:scale-110"
            alt="TrainTact Logo"
          />
        </Link>

        <div className="">
        <div className="h-10"></div>
          <div className="text-sm text-gray-600 mt-4">
            <p className="mb-2">
              © {new Date().getFullYear()} Bash Booker™. All Rights Reserved.
            </p>
            <p>
              Built by{" "}
              <a
                href="#"
                className="text-gray-900 font-semibold hover:text-red-700 transition-colors"
              >
                Ch3RaY
              </a>
            </p>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
