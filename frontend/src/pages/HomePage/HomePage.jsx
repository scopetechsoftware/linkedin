import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import Sidebar from "../../components/Sidebar/Sidebar";
import MobileSidebar from "../../components/MobileSidebar/MobileSidebar";
import PostCreation from "../../components/PostCreation/PostCreation";
import Post from "../../components/Post/Post";
import { Users, LineChart, Menu } from "lucide-react";
import RecommendedUser from "../../components/RecommendedUser/RecommendedUser";
import JobsSection from "../../components/JobsSection";
import { Line } from 'react-chartjs-2';
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const HomePage = () => {
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

	const { data: recommendedUsers } = useQuery({
		queryKey: ["recommendedUsers"],
		queryFn: async () => {
			const res = await axiosInstance.get("/users/suggestions");
			return res.data;
		},
	});

	const { data: projects } = useQuery({
		queryKey: ["userProjects"],
		queryFn: async () => {
			const res = await axiosInstance.get("/projects");
			return res.data;
		},
	});

	const { data: projectRating } = useQuery({
		queryKey: ["projectRating"],
		queryFn: async () => {
			const res = await axiosInstance.get("/projects/my/average-rating");
			return res.data;
		},
	});

	const { data: posts } = useQuery({
		queryKey: ["posts"],
		queryFn: async () => {
			const res = await axiosInstance.get("/posts");
			return res.data;
		},
	});

	const chartData = {
		labels: projects?.map(project => new Date(project.createdAt).toLocaleDateString()) || [],
		datasets: [
			{
				label: 'Project Growth',
				data: projects?.map((_, index) => index + 1) || [],
				borderColor: 'rgb(75, 192, 192)',
				tension: 0.1
			},
			{
				label: 'Project Ratings',
				data: projects?.map(project => project.averageRating || 0) || [],
				borderColor: 'rgb(255, 99, 132)',
				tension: 0.1
			}
		]
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top',
			},
			title: {
				display: true,
				text: 'Project Growth and Ratings'
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				max: Math.max(projects?.length || 0, 5)
			}
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Mobile Sidebar Toggle Button */}
			<div className="md:hidden mb-4">
				<button
					onClick={() => setIsMobileSidebarOpen(true)}
					className="bg-white shadow-md rounded-lg p-3 text-gray-700 hover:bg-gray-50 transition-colors"
				>
					<Menu size={24} />
				</button>
			</div>
			
			<div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
				{/* Sidebar - Hidden on mobile, shown on tablet and desktop */}
				<div className="hidden md:block lg:w-1/4">
					<Sidebar user={authUser} />
				</div>
				
				{/* Main Content - Full width on mobile, 1/2 on desktop */}
				<div className="w-full lg:w-1/2">
					<div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6 lg:mb-8">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg lg:text-xl font-semibold">Project Dashboard</h2>
							<LineChart className="h-5 w-5 text-gray-500" />
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
							<div className="bg-blue-50 p-3 lg:p-4 rounded-lg">
								<h3 className="text-base lg:text-lg font-semibold mb-2">Total Projects</h3>
								<p className="text-2xl lg:text-3xl font-bold text-blue-600">{projects?.length || 0}</p>
							</div>
							<div className="bg-green-50 p-3 lg:p-4 rounded-lg">
								<h3 className="text-base lg:text-lg font-semibold mb-2">Average Rating</h3>
								<p className="text-2xl lg:text-3xl font-bold text-green-600">{projectRating?.average?.toFixed(1) || '0.0'}</p>
							</div>
						</div>
						<div className="h-48 lg:h-64">
							<Line data={chartData} options={chartOptions} />
						</div>
					</div>

					<PostCreation user={authUser} />
					
					<div className="bg-white rounded-lg shadow p-3 lg:p-4 mb-4">
						<h2 className="text-lg lg:text-xl font-semibold mb-4">All Posts</h2>
						<div className="space-y-4">
							{posts?.map((post) => (
								<Post key={post._id} post={post} />
							))}
						</div>
					</div>
				</div>

				{/* Right Sidebar - Hidden on mobile, shown on tablet and desktop */}
				<div className="hidden md:block lg:w-1/4">
					<div className="bg-white rounded-lg shadow p-3 lg:p-4 mb-4">
						<div className="flex items-center gap-2 mb-4">
							<Users className="w-5 h-5" />
							<h2 className="text-lg lg:text-xl font-semibold">Recommended</h2>
						</div>
						<div className="space-y-4">
							{recommendedUsers?.map((user) => (
								<RecommendedUser key={user._id} user={user} />
							))}
						</div>
					</div>
					<JobsSection />
				</div>
			</div>
			
			{/* Mobile Sidebar */}
			<MobileSidebar 
				user={authUser} 
				isOpen={isMobileSidebarOpen} 
				onClose={() => setIsMobileSidebarOpen(false)} 
			/>
		</div>
	);
};

export default HomePage;