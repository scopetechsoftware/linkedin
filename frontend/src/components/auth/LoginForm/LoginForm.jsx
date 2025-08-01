import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../../../lib/axios";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";
import ForgotPassword from "../ForgotPassword/ForgotPassword";

const LoginForm = () => {
    const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showForgotPassword, setShowForgotPassword] = useState(false);
	const queryClient = useQueryClient();

    const { mutate: loginMutation, isLoading } = useMutation({
		mutationFn: (userData) => axiosInstance.post("/auth/login", userData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: (err) => {
			toast.error(err.response.data.message || "Something went wrong");
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		loginMutation({ username, password });
	};

    return (
        <>
        <form onSubmit={handleSubmit} className='space-y-4 w-full max-w-md'>
			<input
				type='text'
				placeholder='Username'
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				className='input input-bordered w-full'
				required
			/>
			<input
				type='password'
				placeholder='Password'
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				className='input input-bordered w-full'
				required
			/>

				<div className="flex justify-between items-center">
					<button type='submit' className='btn btn-primary flex-1 mr-2'>
				{isLoading ? <Loader className='size-5 animate-spin' /> : "Login"}
			</button>
					<button
						type="button"
						onClick={() => setShowForgotPassword(true)}
						className="text-blue-600 hover:text-blue-800 text-sm font-medium"
					>
						Forgot Password?
					</button>
				</div>
		</form>

			{/* Forgot Password Modal */}
			<ForgotPassword 
				isOpen={showForgotPassword} 
				onClose={() => setShowForgotPassword(false)} 
			/>
        </>
    )
}

export default LoginForm