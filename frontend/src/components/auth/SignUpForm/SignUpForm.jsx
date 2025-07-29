import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader } from "lucide-react";
import { axiosInstance } from '../../../lib/axios.js';
import toast from "react-hot-toast";

const SignUpForm = () => {
    const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState("");

    const queryClient = useQueryClient();

    const {mutate: signUpMutation, isLoading} = useMutation({
        mutationFn: async (data) => {
            const res = await axiosInstance.post("/auth/signup", data);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Account created successfully");
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (err) => {
            toast.error(err.response.data.message || "Something went wrong");
        }
    })

    const handleSignUp = (e) => {
		e.preventDefault();
        signUpMutation({name, email, username, password, role});
	};
    return (
        <form onSubmit={handleSignUp} className='flex flex-col gap-4'>
			<input
				type='text'
				placeholder='Full name'
				value={name}
				onChange={(e) => setName(e.target.value)}
				className='input input-bordered w-full'
				required
			/>
			<input
				type='text'
				placeholder='Username'
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				className='input input-bordered w-full'
				required
			/>
			<input
				type='email'
				placeholder='Email'
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				className='input input-bordered w-full'
				required
			/>
			<input
				type='password'
				placeholder='Password (6+ characters)'
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				className='input input-bordered w-full'
				required
			/>

            <div className='w-full'>
				<select
					value={role}
					onChange={(e) => setRole(e.target.value)}
					className='select select-bordered w-full'
					required
				>
					<option value="" disabled>Select your role</option>
					<option value="student">Student</option>
					<option value="employee">Employee</option>
					<option value="employer">Employer</option>
					<option value="company">Company</option>
					<option value="university">University</option>
					<option value="freelancer">Freelancer</option>
					<option value="professor">Professor</option>
				</select>
			</div>

            <button type='submit' disabled={isLoading} className='btn btn-primary w-full text-white'>
				{isLoading ? <Loader className='size-5 animate-spin' /> : "Agree & Join"}
			</button>
		</form>
    )
}

export default SignUpForm