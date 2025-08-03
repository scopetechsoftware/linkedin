import { useState } from "react";
import { X, Send, User, Mail, Building, Users, Award, Calendar, MapPin, Brain } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const AIChatWindow = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: searchUser } = useMutation({
    mutationFn: async ({ username, email }) => {
      const params = new URLSearchParams();
      if (username) params.append("username", username);
      if (email) params.append("email", email);
      // Add source parameter to indicate this is an AI search
      params.append("source", "ai");
      
      const response = await axiosInstance.get(`/users/search?${params.toString()}`);
      return response.data;
    },
    onSuccess: (data) => {
      setUserData(data);
      setIsLoading(false);
      toast.success("User found!");
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(error.response?.data?.message || "User not found");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username && !email) {
      toast.error("Please enter username or email");
      return;
    }
    setIsLoading(true);
    searchUser({ username, email });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 sm:w-96 h-[500px] sm:h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Brain size={16} />
            </div>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs text-blue-100">Find user details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 p-3 lg:p-4 overflow-y-auto h-[400px] sm:h-[500px]">
        {!userData ? (
          // Input Form
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                👋 Hi! I can help you find user details. Please enter a username or email address.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User size={14} className="inline mr-1" />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail size={14} className="inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Search User</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
                      // User Details Display
          <div className="space-y-4">
            {userData.message ? (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ {userData.message}
                </p>
              </div>
            ) : (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Found user details! Here's what I found:
                </p>
              </div>
            )}
            
            {/* User Profile */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={userData.profilePicture?  `http://localhost:5000/uploads/${userData.profilePicture}` : "/avatar.png"}
                  alt={userData.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-lg">{userData.name}</h3>
                  <p className="text-gray-600">@{userData.username}</p>
                  {userData.headline && (
                    <p className="text-sm text-gray-500">{userData.headline}</p>
                  )}
                </div>
              </div>
              
              {/* View Profile Button */}
              <Link 
                to={`/profile/${userData.username}`} 
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors mt-2 mb-3"
                onClick={() => onClose()} // Close the AI chat window when navigating to profile
              >
                View Full Profile
              </Link>
              
              <div className="space-y-2">
                {!userData.privacySettings?.isProfilePrivate && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail size={14} className="text-gray-500" />
                    <span>{userData.email}</span>
                  </div>
                )}
                {userData.location && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin size={14} className="text-gray-500" />
                    <span>{userData.location}</span>
                  </div>
                )}
                {!userData.privacySettings?.isProfilePrivate && userData.createdAt && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar size={14} className="text-gray-500" />
                    <span>Joined {formatDate(userData.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Affiliations */}
            {!userData.privacySettings?.isProfilePrivate && userData.affiliations && userData.affiliations.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Building size={16} className="mr-2" />
                  Affiliations
                </h4>
                <div className="space-y-2">
                  {userData.affiliations.map((affiliation, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{affiliation.affiliator?.name || 'Unknown Organization'}</p>
                          <p className="text-sm text-gray-600">Role: {affiliation.role}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {affiliation.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Start Date: {formatDate(affiliation.startDate)}</p>
                        {affiliation.endDate && (
                          <p>End Date: {formatDate(affiliation.endDate)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {!userData.privacySettings?.isProfilePrivate && userData.experience && userData.experience.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Award size={16} className="mr-2" />
                  Experience
                </h4>
                <div className="space-y-2">
                  {userData.experience.map((exp, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {exp.duration}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {!userData.privacySettings?.isProfilePrivate && userData.skills && userData.skills.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Award size={16} className="mr-2" />
                  Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* New Search Button */}
            <button
              onClick={() => {
                setUserData(null);
                setUsername("");
                setEmail("");
              }}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Search Another User
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatWindow;