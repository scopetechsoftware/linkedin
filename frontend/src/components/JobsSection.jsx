import { useNavigate } from "react-router-dom";

const JobsSection = () => {
  const navigate = useNavigate();
  return (
    <div
      className="mb-8 bg-white rounded-lg shadow p-6 cursor-pointer hover:bg-gray-50 transition"
      onClick={() => navigate("/jobs")}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Job Postings</h2>
        <span className="text-primary underline">View all</span>
      </div>
      <p className="text-gray-600 mt-2">See and post new job opportunities</p>
    </div>
  );
};

export default JobsSection;
