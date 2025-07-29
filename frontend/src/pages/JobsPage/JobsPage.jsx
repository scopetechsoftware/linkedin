import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, Calendar } from "lucide-react";

const JobsPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/v1/jobs");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });

  if (isLoading) return <div className="p-8 text-center">Loading jobs...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error.message}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Job Postings</h1>
      <div className="space-y-4">
        {data && data.length > 0 ? (
          data.map((job) => (
            <div key={job._id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">{job.title}</h2>
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <Briefcase className="mr-1" size={16} />
                  {job.createdBy?.name || "Unknown"}
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
              <Link to={`/jobs/${job._id}`} className="mt-2 md:mt-0 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark text-center">View Details</Link>
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