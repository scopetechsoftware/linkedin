import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Calendar } from "lucide-react";
import { axiosInstance } from "../../lib/axios";

const JobDetailsPage = () => {
  const { id } = useParams();
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/jobs/${id}`);
      return res.data;
    },
  });

  if (isLoading) return <div className="p-8 text-center">Loading job...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error.message}</div>;
  if (!job) return <div className="p-8 text-center text-gray-500">Job not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Link to="/jobs" className="text-primary hover:underline">&larr; Back to Jobs</Link>
      <div className="bg-white rounded-lg shadow p-6 mt-4">
        <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <Briefcase className="mr-1" size={16} />
          {job.createdBy?.name || "Unknown"}
        </div>
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <MapPin className="mr-1" size={16} />
          {job.location}
        </div>
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <span className="capitalize mr-2">{job.type}</span>
          <Calendar className="mr-1" size={16} />
          Out: {new Date(job.outDate).toLocaleDateString()}
        </div>
        <div className="mb-2"><span className="font-semibold">Package:</span> {job.package}</div>
        <div className="mb-2"><span className="font-semibold">Skill:</span> {job.skill}</div>
        <div className="mb-2"><span className="font-semibold">Technology:</span> {job.technology}</div>
        <div className="mb-2"><span className="font-semibold">Description:</span> <br />{job.description}</div>
      </div>
    </div>
  );
};

export default JobDetailsPage;