// const adminMiddleware = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized: No token provided" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.SECRET_KEY);
//     if (decoded.role !== "Admin") {
//       return res.status(403).json({ message: "Forbidden: Admins only" });
//     }

//     req.user = decoded; // Attach user info to the request
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Unauthorized: Invalid token" });
//   }
// };
