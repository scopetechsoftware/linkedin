import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Calendar, Star, Sparkles } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import { useState, useEffect } from "react";

const JobDetailsPage = () => {
  const { id } = useParams();
  const [similarJobs, setSimilarJobs] = useState([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  console.log('Job ID from params:', id);
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/jobs/${id}`);
      return res.data;
    },
  });

  // Fetch similar jobs based on skill and location
  useEffect(() => {
    if (job) {
      const fetchSimilarJobs = async () => {
        setIsLoadingSimilar(true);
        try {
          // Use the search endpoint with the job's skill and location
          const response = await axiosInstance.get(`/search/jobs`, {
            params: {
              query: job.title, // Use job title as the base query
              skill: job.skill,
              location: job.location
            }
          });
          // Filter out the current job and limit to 3 similar jobs
          const filteredJobs = response.data
            .filter(similarJob => similarJob._id !== job._id)
            .slice(0, 3);
          setSimilarJobs(filteredJobs);
        } catch (error) {
          console.error("Error fetching similar jobs:", error);
        } finally {
          setIsLoadingSimilar(false);
        }
      };
      fetchSimilarJobs();
    }
  }, [job]);

  if (isLoading) return <div className="p-8 text-center">Loading job...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error.message}</div>;
  if (!job) return <div className="p-8 text-center text-gray-500">Job not found.</div>;

  // Calculate skill and location match percentage for similar jobs
  const calculateMatchPercentage = (similarJob) => {
    let matchScore = 0;

    // Check skill match
    if (similarJob.skill && job.skill &&
      similarJob.skill.toLowerCase().includes(job.skill.toLowerCase()) ||
      job.skill.toLowerCase().includes(similarJob.skill.toLowerCase())) {
      matchScore += 50; // 50% for skill match
    }

    // Check location match
    if (similarJob.location && job.location &&
      similarJob.location.toLowerCase().includes(job.location.toLowerCase()) ||
      job.location.toLowerCase().includes(similarJob.location.toLowerCase())) {
      matchScore += 50; // 50% for location match
    }

    return matchScore;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-6">
      {/* Main job details */}
      <div className="md:w-2/3">
        <Link to="/jobs" className="text-primary hover:underline">&larr; Back to Jobs</Link>
        <div className="bg-white rounded-lg shadow p-6 mt-4">
          <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <Briefcase className="mr-1" size={16} />
            {job.createdBy ? (
              <Link
                to={`/profile/${job.createdBy.username}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {job.createdBy.name}
              </Link>
            ) : (
              "Unknown"
            )}
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
          <div className="mb-2">
            <span className="font-semibold">Apply Link:</span> <br />
            <a
              href={job.applylink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-words"
            >
              {job.applylink}
            </a>
          </div>
        </div>
      </div>

      {/* Similar jobs sidebar */}
      <div className="md:w-1/3">
        <div className="bg-white rounded-lg shadow p-6 sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-yellow-500" size={20} />
            <h2 className="text-lg font-semibold">Recommended Jobs</h2>
          </div>

          {isLoadingSimilar ? (
            <div className="text-center py-4 text-gray-500">Loading recommendations...</div>
          ) : similarJobs.length > 0 ? (
            <div className="space-y-4">
              {similarJobs.map(similarJob => {
                const matchPercentage = calculateMatchPercentage(similarJob);
                return (
                  <Link
                    key={similarJob._id}
                    to={`/jobs/${similarJob._id}`}
                    className="block border rounded-lg p-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-primary">{similarJob.title}</h3>
                      <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                        <Star size={12} className="mr-1" />
                        {matchPercentage}% Match
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {similarJob.createdBy ? (
                        <Link
                          to={`/profile/${similarJob.createdBy.username}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {similarJob.createdBy.name}
                        </Link>
                      ) : (
                        "Unknown"
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin size={12} className="mr-1" />
                      {similarJob.location}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {similarJob.skill && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {similarJob.skill}
                        </span>
                      )}
                      {similarJob.technology && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
                          {similarJob.technology}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No similar jobs found</div>
          )}

          <div className="mt-4 pt-4 border-t">
            <Link to="/jobs" className="text-primary hover:underline text-sm flex items-center justify-center">
              View all job postings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;