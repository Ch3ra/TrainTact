import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/images/Logo.png";
import loginBG from "../assets/images/loginBG.jpg";
import googleLogo from "../assets/images/googlelogo.png";

const Login = () => {
  return (
    <div className="flex justify-center flex-1">
      <div className="absolute top-0 left-0 p-4">
        <img src={logo} alt="TrainTact Logo" className="w-32" />
      </div>

      <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
        <div className="mt-12 flex flex-col items-center">
          <h1 className="text-5xl xl:text-4xl font-medium">
            Login to TrainTact
          </h1>
          <div className="w-full flex-1 mt-8">
            <div className="mx-auto max-w-xs">
              <div className="relative mt-6">
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email Address"
                  className="peer mt-2 w-full bg-transparent border-b-2 border-gray-300 pl-12 py-1 placeholder:text-transparent focus:border-gray-500 focus:outline-none"
                  autoComplete="off"
                />
                <label
                  htmlFor="email"
                  className="pointer-events-none absolute top-0 left-9 origin-left -translate-y-1/2 bg-transparent transform text-sm text-gray-800 opacity-75 transition-all duration-100 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0 peer-focus:pl-0 peer-focus:text-sm peer-focus:text-gray-800"
                >
                  Email Address
                </label>
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500"
                />
              </div>
              <div className="relative mt-6">
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Password"
                  className="peer mt-2 w-full bg-transparent border-b-2 border-gray-300 pl-12 py-1 placeholder:text-transparent focus:border-gray-500 focus:outline-none"
                />
                <label
                  htmlFor="password"
                  className="pointer-events-none absolute top-0 left-9 origin-left -translate-y-1/2 transform text-sm text-gray-800 opacity-75 transition-all duration-100 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0 peer-focus:pl-0 peer-focus:text-sm peer-focus:text-gray-800"
                >
                  Password
                </label>
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500"
                />
              </div>
              <div className="flex items-center justify-between mt-8">
                <button
                  type="submit"
                  className="btn flex items-center justify-center px-8 py-3 border border-transparent text-base font-normal rounded-md text-white bg-red-600 hover:bg-red-700 md:py-4 md:text-lg md:px-10"
                >
                  Log In
                </button>
                <Link
                  to="/forget-password"
                  className="font-normal text-red-500"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>
          <div className="flex justify-evenly items-center space-x-2 w-80 mt-4">
            <span className="bg-gray-300 h-px flex-grow t-2 relative top-2"></span>
            <span className="flex-none uppercase text-md text-gray-900 mt-4 font-semibold">
              or
            </span>
            <span className="bg-gray-300 h-px flex-grow t-2 relative top-2"></span>
          </div>
          <div className="mt-4 w-full flex flex-col items-center gap-3">
            <button className="w-full flex items-center justify-center px-6 py-2 border border-gray-800 rounded-md shadow-sm max-w-xs text-sm font-medium text-gray-800 bg-white hover:bg-gray-100">
              <img
                src={googleLogo}
                alt="Google Logo"
                className="h-6 w-6 mr-3"
              />
              <span>Continue with Google</span>
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-red-600 font-medium">
                Sign Up
              </Link>
            </p>
          </div>
          <div className="mt-6">
            <Link
              to="/signup"
              className="w-[130px] h-[50px] flex items-center justify-center border border-transparent text-base font-normal rounded-[15px] text-white bg-red-600 hover:bg-red-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-indigo-100 text-center hidden lg:flex">
        <div
          className="flex-1 bg-indigo-100 text-center hidden lg:flex"
          style={{
            backgroundImage: `url(${loginBG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "100vh",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
      </div>
    </div>
  );
};

export default Login;
