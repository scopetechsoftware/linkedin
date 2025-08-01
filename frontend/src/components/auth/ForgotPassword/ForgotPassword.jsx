import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios";
import { X, Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const ForgotPassword = ({ isOpen, onClose }) => {
	const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	// Send OTP mutation
	const { mutate: sendOTP, isLoading: isSendingOTP } = useMutation({
		mutationFn: (email) => axiosInstance.post("/auth/send-otp", { email }),
		onSuccess: () => {
			toast.success("OTP sent to your email");
			setStep(2);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "Failed to send OTP");
		},
	});

	// Verify OTP mutation
	const { mutate: verifyOTP, isLoading: isVerifyingOTP } = useMutation({
		mutationFn: ({ email, otp }) => axiosInstance.post("/auth/verify-otp", { email, otp }),
		onSuccess: () => {
			toast.success("OTP verified successfully");
			setStep(3);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "Invalid OTP");
		},
	});

	// Reset password mutation
	const { mutate: resetPassword, isLoading: isResettingPassword } = useMutation({
		mutationFn: ({ email, otp, newPassword }) =>
			axiosInstance.post("/auth/reset-password", { email, otp, newPassword }),
		onSuccess: () => {
			toast.success("Password reset successfully");
			onClose();
			// Reset form
			setEmail("");
			setOtp("");
			setNewPassword("");
			setStep(1);
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "Failed to reset password");
		},
	});

	const handleSendOTP = (e) => {
		e.preventDefault();
		if (!email) {
			toast.error("Please enter your email");
			return;
		}
		sendOTP(email);
	};

	const handleVerifyOTP = (e) => {
		e.preventDefault();
		if (!otp) {
			toast.error("Please enter the OTP");
			return;
		}
		verifyOTP({ email, otp });
	};

	const handleResetPassword = (e) => {
		e.preventDefault();
		if (!newPassword) {
			toast.error("Please enter a new password");
			return;
		}
		if (newPassword.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}
		resetPassword({ email, otp, newPassword });
	};

	const handleClose = () => {
		onClose();
		// Reset form
		setEmail("");
		setOtp("");
		setNewPassword("");
		setStep(1);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Forgot Password</h2>
					<button
						onClick={handleClose}
						className="p-1 rounded-full hover:bg-gray-200 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{/* Progress indicator */}
				<div className="flex items-center justify-center mb-6">
					<div className="flex items-center">
						<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
							step >= 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
						}`}>
							1
						</div>
						<div className={`w-12 h-1 ${step >= 2 ? "bg-blue-500" : "bg-gray-200"}`}></div>
						<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
							step >= 2 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
						}`}>
							2
						</div>
						<div className={`w-12 h-1 ${step >= 3 ? "bg-blue-500" : "bg-gray-200"}`}></div>
						<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
							step >= 3 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
						}`}>
							3
						</div>
					</div>
				</div>

				{/* Step 1: Email */}
				{step === 1 && (
					<form onSubmit={handleSendOTP} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email Address
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Enter your email"
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
							</div>
						</div>
						<button
							type="submit"
							disabled={isSendingOTP}
							className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isSendingOTP ? "Sending..." : "Send OTP"}
						</button>
					</form>
				)}

				{/* Step 2: OTP Verification */}
				{step === 2 && (
					<form onSubmit={handleVerifyOTP} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Enter OTP
							</label>
							<input
								type="text"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								placeholder="Enter 6-digit OTP"
								maxLength={6}
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
								required
							/>
							<p className="text-sm text-gray-500 mt-1">
								OTP sent to {email}
							</p>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setStep(1)}
								className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
							>
								Back
							</button>
							<button
								type="submit"
								disabled={isVerifyingOTP}
								className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isVerifyingOTP ? "Verifying..." : "Verify OTP"}
							</button>
						</div>
					</form>
				)}

				{/* Step 3: New Password */}
				{step === 3 && (
					<form onSubmit={handleResetPassword} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								New Password
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
								<input
									type={showPassword ? "text" : "password"}
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="Enter new password"
									className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
							<p className="text-sm text-gray-500 mt-1">
								Password must be at least 6 characters
							</p>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setStep(2)}
								className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
							>
								Back
							</button>
							<button
								type="submit"
								disabled={isResettingPassword}
								className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isResettingPassword ? "Changing..." : "Change Password"}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default ForgotPassword; 