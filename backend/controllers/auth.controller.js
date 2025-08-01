import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import nodemailer from "nodemailer";

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

// Generate OTP
const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: "Password Reset OTP",
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #0077b5;">Password Reset Request</h2>
				<p>You have requested to reset your password. Use the following OTP to verify your identity:</p>
				<div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
					<h1 style="color: #0077b5; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
				</div>
				<p>This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
				<p>Best regards,<br>UnLinked Team</p>
			</div>
		`,
	};

	try {
		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.error("Error sending OTP email:", error);
		return false;
	}
};

export const signup = async (req, res) => {
	try {
		const { name, username, email, password, role } = req.body;

		if (!name || !username || !email || !password || !role) {
			return res.status(400).json({ message: "All fields are required" });
		}
		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ message: "Email already exists" });
		}

		const existingUsername = await User.findOne({ username });
		if (existingUsername) {
			return res.status(400).json({ message: "Username already exists" });
		}

		if (password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const user = new User({
			name,
			email,
			password: hashedPassword,
			username,
			role,
		});

		await user.save();

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

		res.cookie("jwt-linkedin", token, {
			httpOnly: true, // prevent XSS attack
			maxAge: 3 * 24 * 60 * 60 * 1000,
			sameSite: "strict", // prevent CSRF attacks,
			secure: process.env.NODE_ENV === "production", // prevents man-in-the-middle attacks
		});

		res.status(201).json({ message: "User registered successfully" });

        const profileUrl = process.env.CLIENT_URL + "/profile/" + user.username;

		try {
			await sendWelcomeEmail(user.email, user.name, profileUrl);
		} catch (emailError) {
			console.error("Error sending welcome Email", emailError);
		}
	} catch (error) {
		console.log("Error in signup: ", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const login = async (req, res) => {
	try {
		const { username, password } = req.body;

		const user = await User.findOne({ username });
		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
		await res.cookie("jwt-linkedin", token, {
			httpOnly: true,
			maxAge: 3 * 24 * 60 * 60 * 1000,
			sameSite: "strict",
			secure: process.env.NODE_ENV === "production",
		});

		res.json({ message: "Logged in successfully" });
	} catch (error) {
		console.error("Error in login controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const logout = (req, res) => {
	res.clearCookie("jwt-linkedin");
	res.json({ message: "Logged out successfully" });
};

export const getCurrentUser = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		console.error("Error in getCurrentUser controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const sendOTP = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}

		// Check if user exists
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({ message: "User not found with this email" });
		}

		// Generate OTP
		const otp = generateOTP();
		
		// Store OTP with expiration (10 minutes)
		otpStore.set(email, {
			otp,
			expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
		});

		// Send OTP email
		const emailSent = await sendOTPEmail(email, otp);
		if (!emailSent) {
			return res.status(500).json({ message: "Failed to send OTP email" });
		}

		res.json({ message: "OTP sent successfully" });
	} catch (error) {
		console.error("Error in sendOTP:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const verifyOTP = async (req, res) => {
	try {
		const { email, otp } = req.body;

		if (!email || !otp) {
			return res.status(400).json({ message: "Email and OTP are required" });
		}

		// Check if OTP exists and is valid
		const storedOTP = otpStore.get(email);
		if (!storedOTP) {
			return res.status(400).json({ message: "OTP not found or expired" });
		}

		if (Date.now() > storedOTP.expiresAt) {
			otpStore.delete(email);
			return res.status(400).json({ message: "OTP has expired" });
		}

		if (storedOTP.otp !== otp) {
			return res.status(400).json({ message: "Invalid OTP" });
		}

		// OTP is valid, mark as verified
		otpStore.set(email, {
			...storedOTP,
			verified: true,
		});

		res.json({ message: "OTP verified successfully" });
	} catch (error) {
		console.error("Error in verifyOTP:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { email, otp, newPassword } = req.body;

		if (!email || !otp || !newPassword) {
			return res.status(400).json({ message: "Email, OTP, and new password are required" });
		}

		// Check if OTP exists and is verified
		const storedOTP = otpStore.get(email);
		if (!storedOTP || !storedOTP.verified) {
			return res.status(400).json({ message: "Please verify OTP first" });
		}

		if (storedOTP.otp !== otp) {
			return res.status(400).json({ message: "Invalid OTP" });
		}

		// Validate password
		if (newPassword.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters" });
		}

		// Find user and update password
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Hash new password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		// Update password
		user.password = hashedPassword;
		await user.save();

		// Clear OTP from store
		otpStore.delete(email);

		res.json({ message: "Password reset successfully" });
	} catch (error) {
		console.error("Error in resetPassword:", error);
		res.status(500).json({ message: "Server error" });
	}
};
