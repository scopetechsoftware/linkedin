import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import Sidebar from "../../components/Sidebar/Sidebar";
import PostCreation from "../../components/PostCreation/PostCreation";
import Post from "../../components/Post/Post";
import { Users, LineChart } from "lucide-react";
import RecommendedUser from "../../components/RecommendedUser/RecommendedUser";
import JobsSection from "../../components/JobsSection";
import { Line } from 'react-chartjs-2';
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
			const res = await axiosInstance.get("/projects/rating/overall");
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
			<div className="flex gap-8">
				<div className="w-1/4">
					<Sidebar user={authUser} />
				</div>
				<div className="w-1/2">
					<div className="bg-white rounded-lg shadow p-6 mb-8">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold">Project Dashboard</h2>
							<LineChart className="h-5 w-5 text-gray-500" />
						</div>
						<div className="grid grid-cols-2 gap-4 mb-6">
							<div className="bg-blue-50 p-4 rounded-lg">
								<h3 className="text-lg font-semibold mb-2">Total Projects</h3>
								<p className="text-3xl font-bold text-blue-600">{projects?.length || 0}</p>
							</div>
							<div className="bg-green-50 p-4 rounded-lg">
								<h3 className="text-lg font-semibold mb-2">Average Rating</h3>
								<p className="text-3xl font-bold text-green-600">{projectRating?.average?.toFixed(1) || '0.0'}</p>
							</div>
						</div>
						<div className="h-64">
							<Line data={chartData} options={chartOptions} />
						</div>
					</div>

					<PostCreation user={authUser} />
					<div className="space-y-4">
						{posts?.map((post) => (
							<Post key={post._id} post={post} />
						))}
					</div>
				</div>

				<div className="w-1/4">
					<div className="bg-white rounded-lg shadow p-4 mb-4">
						<div className="flex items-center gap-2 mb-4">
							<Users className="w-5 h-5" />
							<h2 className="text-xl font-semibold">Recommended</h2>
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
		</div>
	);
};

export default HomePage;