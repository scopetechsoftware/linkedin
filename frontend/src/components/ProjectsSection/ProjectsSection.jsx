import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { Briefcase, ExternalLink, Github, Star, Plus, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProjectsSection = ({ userData, isOwnProfile, onSave }) => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        gitlink: '',
        projecturl: '',
        type: 'academic'
    });

    // Fetch user projects
    const { data: projects, isLoading } = useQuery({
        queryKey: ['userProjects', userData.username],
        queryFn: async () => {
            const response = await axiosInstance.get(`/projects/user/${userData.username}`);
            return response.data;
        },
    });

    // Add project mutation
    const { mutate: addProject, isPending: isAddingProject } = useMutation({
        mutationFn: async (projectData) => {
            const formData = new FormData();
            formData.append('name', projectData.name);
            formData.append('description', projectData.description);
            formData.append('gitlink', projectData.gitlink);
            formData.append('projecturl', projectData.projecturl);
            formData.append('type', projectData.type);
            
            const response = await axiosInstance.post('/projects', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['userProjects', userData.username]);
            toast.success('Project added successfully');
            setIsEditing(false);
            setNewProject({
                name: '',
                description: '',
                gitlink: '',
                projecturl: '',
                type: 'academic'
            });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add project');
        }
    });

    // Delete project mutation
    const { mutate: deleteProject } = useMutation({
        mutationFn: async (projectId) => {
            await axiosInstance.delete(`/projects/${projectId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['userProjects', userData.username]);
            toast.success('Project deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete project');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newProject.name) {
            toast.error('Project name is required');
            return;
        }
        addProject(newProject);
    };

    const handleDelete = (projectId) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            deleteProject(projectId);
        }
    };

    if (isLoading) return <div className="bg-white rounded-lg shadow p-6 my-4">Loading projects...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6 my-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                    <Briefcase className="mr-2" size={20} />
                    Projects
                </h2>
                {isOwnProfile && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-primary hover:text-primary-dark flex items-center"
                    >
                        <Plus size={16} className="mr-1" />
                        Add Project
                    </button>
                )}
            </div>

            {isEditing && (
                <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Project Name*</label>
                        <input
                            type="text"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Project Type</label>
                        <select
                            value={newProject.type}
                            onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                            className="w-full p-2 border rounded"
                        >
                            <option value="academic">Academic</option>
                            <option value="freelancing">Freelancing</option>
                            <option value="volunteer">Volunteer Work</option>
                            <option value="work">Work</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">GitHub Link</label>
                        <input
                            type="url"
                            value={newProject.gitlink}
                            onChange={(e) => setNewProject({ ...newProject, gitlink: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="https://github.com/username/repo"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Project URL</label>
                        <input
                            type="url"
                            value={newProject.projecturl}
                            onChange={(e) => setNewProject({ ...newProject, projecturl: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="https://example.com"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            className="w-full p-2 border rounded"
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                            disabled={isAddingProject}
                        >
                            {isAddingProject ? 'Adding...' : 'Add Project'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {projects?.length > 0 ? (
                <div className="space-y-4">
                    {projects.map((project) => (
                        <div key={project._id} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <div className="flex justify-between">
                                <h3 className="font-semibold text-lg">{project.name}</h3>
                                {isOwnProfile && (
                                    <div className="flex gap-2">
                                        <Link to={`/projects/${project._id}`} className="text-primary hover:text-primary-dark">
                                            <Edit size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(project._id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 capitalize">{project.type}</p>
                            {project.description && (
                                <p className="text-gray-700 mt-2">{project.description}</p>
                            )}
                            
                            <div className="flex items-center gap-1 mt-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className={i < Math.round(project.averageRating || 0) ? "text-yellow-500" : "text-gray-300"}>★</span>
                                ))}
                                <span className="ml-1 text-sm text-gray-600">
                                    ({project.averageRating ? project.averageRating.toFixed(1) : "0.0"})
                                </span>
                            </div>
                            
                            <div className="flex gap-3 mt-3">
                                {project.gitlink && (
                                    <a
                                        href={project.gitlink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm flex items-center text-gray-600 hover:text-primary"
                                    >
                                        <Github size={14} className="mr-1" />
                                        GitHub
                                    </a>
                                )}
                                {project.projecturl && (
                                    <a
                                        href={project.projecturl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm flex items-center text-gray-600 hover:text-primary"
                                    >
                                        <ExternalLink size={14} className="mr-1" />
                                        Live Demo
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 italic">
                    {isOwnProfile
                        ? "You haven't added any projects yet. Add your first project to showcase your work!"
                        : `${userData.name} hasn't added any projects yet.`}
                </p>
            )}
        </div>
    );
};

export default ProjectsSection;