// import React from 'react'
// import logo from "../assets/images/Logo.png";
// import clientlogo from "../assets/images/clientlogo.png";
// import gymTrainer from "../assets/images/gymTrainer.webp";
// import { Link } from 'react-router-dom';

// const SelectionPage = () => {
//     return (
//       <div className="p-6 bg-gray-100 min-h-screen">
//   {/* Logo at the top left corner */}
//   <div className="mb-8">
//     <img src={logo} alt="Zymmy Club Logo" className="w-24" />
//   </div>

//   {/* Content Section */}
//   <h1 className="text-3xl font-semibold text-center mt-4">
//     Join as a Client or Trainer
//   </h1>
//   <div className="flex justify-center mt-12 space-x-4">
//     {/* Client Section */}
//     <div className="text-center border p-6 border-black rounded-md w-60 cursor-pointer">
//       <img
//         src={clientlogo}
//         alt="Client"
//         className="w-20 h-20 mx-auto mb-4 rounded-full"
//       />
//       <p className="font-semibold text-lg">I’m a client, hiring a trainer</p>
//     </div>
//     {/* Trainer Section */}
//     <div className="text-center border border-black p-6 rounded-md w-60 cursor-pointer">
//       <img
//         src={gymTrainer}
//         alt="Trainer"
//         className="w-20 h-20 mx-auto mb-4 rounded-full"
//       />
//       <p className="font-semibold text-lg">I’m a trainer, looking for work</p>
//     </div>
//   </div>
//   {/* Login Link */}
//   <div className="text-center mt-6">
//     <p className="text-sm text-gray-600">
//       Already have an account?{" "}
//       <Link to="/login" className="text-blue-500 font-semibold">
//         Log In
//       </Link>
//     </p>
//   </div>
// </div>
//       );
// }

// export default SelectionPage