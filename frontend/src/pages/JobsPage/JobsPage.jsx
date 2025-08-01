import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, Calendar, Plus } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import { useState } from "react";
import JobPostingForm from "../../components/JobPostingForm/JobPostingForm";

const JobsPage = () => {
  const queryClient = useQueryClient();
  const [showJobForm, setShowJobForm] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await axiosInstance.get("/jobs");
      return res.data;
    },
  });

  // Handler to refresh jobs after posting
  const handleJobPosted = () => {
    setShowJobForm(false);
    queryClient.invalidateQueries(["jobs"]);
  };

  if (isLoading) return <div className="p-8 text-center">Loading jobs...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error.message}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Job Postings</h1>
        <button
          onClick={() => setShowJobForm(true)}
          className="bg-primary text-white py-2 px-4 rounded flex items-center"
        >
          <Plus size={18} className="mr-1" /> Post Job
        </button>
      </div>

      {/* Job Posting Modal */}
      <JobPostingForm isOpen={showJobForm} onClose={() => setShowJobForm(false)} onPosted={handleJobPosted} />

      <div className="space-y-4">
        {data && data.length > 0 ? (
          data.map((job) => (
            <div key={job._id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between relative">
              <Link to={`/jobs/${job._id}`} className="absolute inset-0 z-0" aria-label={`View details for ${job.title}`}></Link>
              <div className="relative z-10">
                <h2 className="text-lg font-semibold mb-1">{job.title}</h2>
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <Briefcase className="mr-1" size={16} />
                  {job.createdBy ? (
                    <Link 
                      to={`/profile/${job.createdBy.username}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {job.createdBy.name}
                    </Link>
                  ) : (
                    "Unknown"
                  )}
                </div>
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <MapPin className="mr-1" size={16} />
                  {job.location}
                </div>
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <span className="capitalize mr-2">{job.type}</span>
                  <Calendar className="mr-1" size={16} />
                  Out: {new Date(job.outDate).toLocaleDateString()}
                </div>
              </div>
              <Link to={`/jobs/${job._id}`} className="mt-2 md:mt-0 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark text-center inline-block relative z-10">View Details</Link>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">No jobs found.</div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;