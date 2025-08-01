import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { axiosInstance } from '../../lib/axios';
import { Camera, MapPin, Save, User, Briefcase, GraduationCap, Code, Lock } from 'lucide-react';
import ForgotPassword from '../../components/auth/ForgotPassword/ForgotPassword';

const SettingsPage = () => {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ['authUser'],
  });

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { mutate: updateProfile, isLoading: isUpdating } = useMutation({
    mutationFn: async (updatedData) => {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.keys(updatedData).forEach(key => {
        if ((key === 'profilePicture' || key === 'bannerImg') && updatedData[key] && 
          typeof updatedData[key] === 'object') {
          formData.append(key, updatedData[key]);
        } else if (key !== 'profilePicturePreview' && key !== 'bannerImgPreview') {
          // Don't append preview data to FormData
          if (Array.isArray(updatedData[key])) {
            formData.append(key, JSON.stringify(updatedData[key]));
          } else {
            formData.append(key, updatedData[key]);
          }
        }
      });
      
      await axiosInstance.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries(['authUser']);
      queryClient.invalidateQueries(['userProfile', authUser?.username]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Store the file object directly for FormData
      setFormData((prev) => ({ ...prev, [event.target.name]: file }));
      
      // Also create a preview for UI display
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store the preview separately for display purposes only
        if (event.target.name === 'profilePicture') {
          setFormData((prev) => ({ ...prev, profilePicturePreview: reader.result }));
        } else if (event.target.name === 'bannerImg') {
          setFormData((prev) => ({ ...prev, bannerImgPreview: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update the form data with the new value
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // We'll validate empty fields on submit instead of during typing
    // This allows users to freely edit, including erasing the first letter
  };

  const handleArrayInputChange = (field, index, key, value) => {
    // Allow editing but prevent completely empty values for important fields
    if (value === '' && (key === 'title' || key === 'company' || key === 'degree' || key === 'school')) {
      // For empty values in important fields, get the original value if available
      const originalArray = authUser?.[field] || [];
      const originalValue = originalArray[index]?.[key] || '';
      
      // Instead of forcing the original value, we'll allow empty string but keep the object structure
      setFormData(prev => {
        // Create a deep copy of the array to avoid modifying frozen objects
        const newArray = (prev[field] || (authUser?.[field] || [])).map(item => 
          item ? {...item} : {}
        );
        
        // Ensure the index exists
        if (!newArray[index]) {
          newArray[index] = {};
        } else {
          // Make sure we're working with a fresh copy
          newArray[index] = {...newArray[index]};
        }
        
        // Allow empty string but preserve the field
        newArray[index][key] = value;
        return {
          ...prev,
          [field]: newArray
        };
      });
      return;
    }
    
    setFormData(prev => {
      // Create a deep copy of the array to avoid modifying frozen objects
      const newArray = (prev[field] || (authUser?.[field] || [])).map(item => 
        item ? {...item} : {}
      );
      
      // Ensure the index exists
      if (!newArray[index]) {
        newArray[index] = {};
      } else {
        // Make sure we're working with a fresh copy
        newArray[index] = {...newArray[index]};
      }
      
      newArray[index][key] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const addArrayItem = (field, template) => {
    setFormData(prev => {
      // Create a deep copy of the array to avoid modifying frozen objects
      const newArray = (prev[field] || (authUser?.[field] || [])).map(item => 
        item ? {...item} : {}
      );
      // Add the new template item
      newArray.push({...template});
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => {
      // Create a deep copy of the array to avoid modifying frozen objects
      const newArray = (prev[field] || (authUser?.[field] || [])).map(item => 
        item ? {...item} : {}
      );
      newArray.splice(index, 1);
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const updatedData = {...formData};
    
    // Check for empty required fields and use original values if empty
    const requiredFields = ['username', 'headline', 'role'];
    let hasEmptyRequiredField = false;
    
    requiredFields.forEach(field => {
      // Check if the field is empty in formData
      if (updatedData[field] === '') {
        if (authUser[field]) {
          // Use original value if available
          updatedData[field] = authUser[field];
          // Update formData to show the original value in the UI
          setFormData(prev => ({
            ...prev,
            [field]: authUser[field]
          }));
        } else {
          hasEmptyRequiredField = true;
        }
      }
      
      // Ensure field exists by using original value if not in formData
      if (!updatedData[field] && authUser[field]) {
        updatedData[field] = authUser[field];
      }
    });
    
    if (hasEmptyRequiredField) {
      toast.error('Username, headline, and role cannot be empty');
      return;
    }
    
    // Validate experience and education arrays
    if (updatedData.experience) {
      // Create a deep copy and filter out experience items with empty required fields
      updatedData.experience = updatedData.experience
        .map(exp => exp ? {...exp} : {})
        .filter(exp => 
          exp && 
          typeof exp.title === 'string' && 
          typeof exp.company === 'string' && 
          exp.title.trim() !== '' && 
          exp.company.trim() !== ''
        );
    }
    
    if (updatedData.education) {
      // Create a deep copy and filter out education items with empty required fields
      updatedData.education = updatedData.education
        .map(edu => edu ? {...edu} : {})
        .filter(edu => 
          edu && 
          typeof edu.school === 'string' && 
          typeof edu.degree === 'string' && 
          edu.school.trim() !== '' && 
          edu.degree.trim() !== ''
        );
    }
    
    updateProfile(updatedData);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Merge authUser data with formData for display
  const userData = {
    ...authUser,
    ...formData,
    profilePicture: formData.profilePicturePreview || (authUser.profilePicture ? `http://localhost:5000/uploads/${authUser.profilePicture}` : "/avatar.png"),
    bannerImg: formData.bannerImgPreview || (authUser.bannerImg ? `http://localhost:5000/uploads/${authUser.bannerImg}` : "/banner.png")
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Banner and Profile Picture */}
        <div
          className="relative h-48 bg-cover bg-center"
          style={{
            backgroundImage: `url('${userData.bannerImg || "/banner.png"}')`,
          }}
        >
          <label className="absolute top-4 right-4 bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-100 transition">
            <Camera size={20} />
            <input
              type="file"
              className="hidden"
              name="bannerImg"
              onChange={handleImageChange}
            />
          </label>
          
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <img
                src={userData.profilePicture || "/avatar.png"}
                alt={userData.name}
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
              />
              <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-100 transition">
                <Camera size={16} />
                <input
                  type="file"
                  className="hidden"
                  name="profilePicture"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-20 px-8 border-b">
          <div className="flex space-x-8">
            <button
              className={`py-4 px-2 ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} className="inline mr-2" />
              Profile
            </button>
            <button
              className={`py-4 px-2 ${activeTab === 'experience' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('experience')}
            >
              <Briefcase size={16} className="inline mr-2" />
              Experience
            </button>
            <button
              className={`py-4 px-2 ${activeTab === 'education' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('education')}
            >
              <GraduationCap size={16} className="inline mr-2" />
              Education
            </button>
            <button
              className={`py-4 px-2 ${activeTab === 'skills' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('skills')}
            >
              <Code size={16} className="inline mr-2" />
              Skills
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name !== undefined ? formData.name : (authUser.name || '')}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username !== undefined ? formData.username : (authUser.username || '')}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role !== undefined ? formData.role : (authUser.role || '')}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
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
                  <p className="mt-1 text-sm text-gray-500">
                    Your role determines what features are available to you on the platform.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline !== undefined ? formData.headline : (authUser.headline || '')}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  placeholder="Your professional headline"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location !== undefined ? formData.location : (authUser.location || '')}
                    onChange={handleInputChange}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                <textarea
                  name="about"
                  value={formData.about !== undefined ? formData.about : (authUser.about || '')}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  placeholder="Tell us about yourself"
                ></textarea>
              </div>

              {/* Password Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Lock size={20} className="mr-2" />
                  Password Settings
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    Need to change your password? Click the button below to reset it via email.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isProfilePrivate"
                    checked={(() => {
                      // Helper function to safely parse privacySettings
                      const parsePrivacySettings = (settings) => {
                        if (!settings) return { isProfilePrivate: false };
                        if (typeof settings === 'string') {
                          if (settings === '[object Object]') {
                            return { isProfilePrivate: false };
                          }
                          try {
                            return JSON.parse(settings);
                          } catch (e) {
                            console.error('Error parsing privacySettings:', e);
                            return { isProfilePrivate: false };
                          }
                        }
                        return settings;
                      };
                      
                      // Get privacySettings from formData or authUser
                      const settings = formData.hasOwnProperty('privacySettings')
                        ? parsePrivacySettings(formData.privacySettings)
                        : parsePrivacySettings(authUser.privacySettings);
                      
                      return settings.isProfilePrivate || false;
                    })()}
                    onChange={(e) => {
                      setFormData(prev => {
                        // Helper function to safely parse privacySettings
                        const parsePrivacySettings = (settings) => {
                          if (!settings) return {};
                          if (typeof settings === 'string') {
                            if (settings === '[object Object]') {
                              return {};
                            }
                            try {
                              return JSON.parse(settings);
                            } catch (e) {
                              console.error('Error parsing privacySettings:', e);
                              return {};
                            }
                          }
                          return settings;
                        };
                        
                        // Get current settings from formData or authUser
                        const currentSettings = prev.privacySettings
                          ? parsePrivacySettings(prev.privacySettings)
                          : parsePrivacySettings(authUser.privacySettings) || {};
                        
                        return {
                          ...prev,
                          privacySettings: {
                            ...currentSettings,
                            isProfilePrivate: e.target.checked
                          }
                        };
                      });
                    }}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Make my profile private</span>
                </label>
                <p className="mt-1 text-sm text-gray-500 ml-6">
                  When enabled, only your basic information (name, profile picture, headline, and location) will be visible to other users. 
                  Your projects, ratings, dashboard, and detailed information will be hidden.
                </p>
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Experience</h2>
                <button
                  type="button"
                  onClick={() => addArrayItem('experience', { title: '', company: '', location: '', startDate: '', endDate: '', description: '' })}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition"
                >
                  Add Experience
                </button>
              </div>
              
              {(formData.experience || authUser.experience || []).map((exp, index) => exp && (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Experience #{index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('experience', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={exp.title || ''}
                        onChange={(e) => handleArrayInputChange('experience', index, 'title', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={(e) => handleArrayInputChange('experience', index, 'company', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={exp.location !== undefined ? exp.location : ''}
                      onChange={(e) => handleArrayInputChange('experience', index, 'location', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleArrayInputChange('experience', index, 'startDate', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleArrayInputChange('experience', index, 'endDate', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={exp.description || ''}
                      onChange={(e) => handleArrayInputChange('experience', index, 'description', e.target.value)}
                      rows="3"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    ></textarea>
                  </div>
                </div>
              ))}
              
              {(formData.experience || authUser.experience || []).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No experience added yet. Click the button above to add your work experience.
                </div>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Education</h2>
                <button
                  type="button"
                  onClick={() => addArrayItem('education', { school: '', degree: '', field: '', startDate: '', endDate: '', description: '' })}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition"
                >
                  Add Education
                </button>
              </div>
              
              {(formData.education || authUser.education || []).map((edu, index) => edu && (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Education #{index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeArrayItem('education', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                    <input
                      type="text"
                      value={edu.school || ''}
                      onChange={(e) => handleArrayInputChange('education', index, 'school', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree || ''}
                        onChange={(e) => handleArrayInputChange('education', index, 'degree', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field || ''}
                        onChange={(e) => handleArrayInputChange('education', index, 'field', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleArrayInputChange('education', index, 'startDate', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleArrayInputChange('education', index, 'endDate', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={edu.description || ''}
                      onChange={(e) => handleArrayInputChange('education', index, 'description', e.target.value)}
                      rows="3"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    ></textarea>
                  </div>
                </div>
              ))}
              
              {(formData.education || authUser.education || []).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No education added yet. Click the button above to add your educational background.
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Skills</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
                <textarea
                  name="skills"
                  value={formData.skills || (authUser.skills ? authUser.skills.join(', ') : '')}
                  onChange={(e) => {
                    // If the value is completely empty, use the original skills
                    if (e.target.value === '') {
                      setFormData(prev => ({
                        ...prev,
                        skills: authUser.skills || []
                      }));
                      return;
                    }
                    
                    const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
                    setFormData(prev => ({
                      ...prev,
                      skills: e.target.value.includes(',') ? skillsArray : e.target.value
                    }));
                  }}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  placeholder="e.g. JavaScript, React, Node.js, Project Management"
                ></textarea>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your skills separated by commas. These will be displayed on your profile and help others understand your expertise.
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Your Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(typeof formData.skills === 'string' 
                    ? (formData.skills.includes(',') ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [formData.skills]) 
                    : (formData.skills || authUser.skills || [])
                  ).map((skill, index) => (
                    <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                  
                  {(typeof formData.skills === 'string' 
                    ? (formData.skills.includes(',') ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [formData.skills]) 
                    : (formData.skills || authUser.skills || [])
                  ).length === 0 && (
                    <span className="text-gray-500">No skills added yet</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <Link to={`/profile/${authUser.username}`} className="mr-4 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition">
              View Profile
            </Link>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPassword 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </div>
  );
};

export default SettingsPage;