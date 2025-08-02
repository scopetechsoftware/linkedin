import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
	let token;
	try {
		token = req.cookies["jwt-linkedin"];

		if (!token) {
			return res.status(401).json({ message: "Unauthorized - No Token Provided" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!decoded) {
			return res.status(401).json({ message: "Unauthorized - Invalid Token" });
		}

		const user = await User.findById(decoded.userId).select("-password");

		if (!user) {
			return res.status(401).json({ message: "User not found" });
		}

		req.user = user;

		next();
	} catch (error) {
		console.log("Error in protectRoute middleware:", error.message);
		console.log("JWT_SECRET:", process.env.JWT_SECRET);
		console.log("Token:", token);
		
		if (error.name === 'JsonWebTokenError') {
			return res.status(401).json({ message: "Unauthorized - Invalid Token" });
		} else if (error.name === 'TokenExpiredError') {
			return res.status(401).json({ message: "Unauthorized - Token Expired" });
		} else {
			return res.status(500).json({ message: "Internal server error" });
		}
	}
};
