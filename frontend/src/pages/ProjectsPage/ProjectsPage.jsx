import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { Briefcase, ExternalLink, Github, Trash2, Edit, Plus } from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";

// Helper function to read file as data URL
const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const ProjectsPage = () => {
    const { data: authUser } = useQuery({ queryKey: ["authUser"] });
    const queryClient = useQueryClient();
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [projectData, setProjectData] = useState({
        name: "",
        description: "",
        gitlink: "",
        projecturl: "",
        type: "",
        files: []
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [collaborators, setCollaborators] = useState([]);

    // Fetch user projects
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["userProjects"],
        queryFn: async () => {
            const res = await axiosInstance.get("/projects");
            return res.data;
        },
    });
    
    // Fetch users for collaborator search
    const { data: userList = [] } = useQuery({
        queryKey: ["userList"],
        queryFn: async () => {
            const res = await axiosInstance.get("/users/suggestions");
            return res.data;
        },
    });

    // Create project mutation
    const { mutate: createProject } = useMutation({
        mutationFn: async (projectData) => {
            // Create FormData for file uploads
            const formData = new FormData();
            
            // Add project data to FormData
            formData.append('name', projectData.name);
            formData.append('description', projectData.description);
            formData.append('gitlink', projectData.gitlink);
            formData.append('projecturl', projectData.projecturl);
            formData.append('type', projectData.type);
            
            // Add collaborators as JSON string
            if (projectData.collaborators && projectData.collaborators.length > 0) {
                formData.append('collaborators', JSON.stringify(projectData.collaborators));
            }
            
            // Add files to FormData
            if (projectData.files && projectData.files.length > 0) {
                for (let i = 0; i < projectData.files.length; i++) {
                    formData.append('files', projectData.files[i]);
                }
            }
            
            const res = await axiosInstance.post("/projects", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Project created successfully");
            setShowProjectForm(false);
            setProjectData({
                name: "",
                description: "",
                gitlink: "",
                projecturl: "",
                type: "",
                files: []
            });
            setCollaborators([]);
            queryClient.invalidateQueries(["userProjects"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create project");
        },
    });

    // Delete project mutation
    const { mutate: deleteProject } = useMutation({
        mutationFn: async (projectId) => {
            await axiosInstance.delete(`/projects/${projectId}`);
        },
        onSuccess: () => {
            toast.success("Project deleted successfully");
            queryClient.invalidateQueries(["userProjects"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete project");
        },
    });

    const handleDeleteProject = (projectId) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            deleteProject(projectId);
        }
    };
    
    const handleProjectSubmit = () => {
        if (!projectData.name) {
            return toast.error("Project name is required");
        }
        
        const formData = {
            ...projectData,
            collaborators: collaborators.map(c => c._id)
        };
        
        createProject(formData);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className='hidden lg:block lg:col-span-1'>
                <Sidebar user={authUser} />
            </div>

            <div className="col-span-1 lg:col-span-3">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">My Projects</h1>
                        <button
                            onClick={() => setShowProjectForm(!showProjectForm)}
                            className="bg-primary text-white py-2 px-4 rounded-md flex items-center"
                        >
                            <Plus size={18} className="mr-1" /> Add Project
                        </button>
                    </div>
                    
                    {/* Project Form */}
                    {showProjectForm && (
                        <div className="project-form p-6 bg-gray-50 rounded-lg shadow-sm mb-6 border">
                            <h4 className="text-lg font-semibold mb-4">Add New Project</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-1">Project Name:</label>
                                    <input
                                        type="text"
                                        value={projectData.name}
                                        className="w-full p-2 border rounded"
                                        onChange={e => setProjectData({ ...projectData, name: e.target.value })}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-1">Project Type:</label>
                                    <select
                                        value={projectData.type}
                                        className="w-full p-2 border rounded"
                                        onChange={e => setProjectData({ ...projectData, type: e.target.value })}
                                    >
                                        <option value="">-- Select Type --</option>
                                        <option value="academic">Academic</option>
                                        <option value="freelancing">Freelancing</option>
                                        <option value="volunteer">Volunteer Work</option>
                                        <option value="work">Work</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-1">GitHub Link:</label>
                                    <input
                                        type="text"
                                        value={projectData.gitlink}
                                        className="w-full p-2 border rounded"
                                        onChange={e => setProjectData({ ...projectData, gitlink: e.target.value })}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-1">Project URL:</label>
                                    <input
                                        type="text"
                                        value={projectData.projecturl}
                                        className="w-full p-2 border rounded"
                                        onChange={e => setProjectData({ ...projectData, projecturl: e.target.value })}
                                    />
                                </div>

                                <div className="mb-3 md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description:</label>
                                    <textarea
                                        value={projectData.description}
                                        className="w-full p-2 border rounded"
                                        rows="3"
                                        onChange={e => setProjectData({ ...projectData, description: e.target.value })}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-1">Upload Project File:</label>
                                    <input
                                        type="file"
                                        name="files"
                                        directory=""
                                        multiple
                                        className="w-full p-2 border rounded"
                                        onChange={(e) => setProjectData({ ...projectData, files: Array.from(e.target.files) })}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-1">Search Collaborators:</label>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        className="w-full p-2 border rounded"
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or email"
                                    />

                                    {searchQuery.length > 0 && (
                                        <ul className="collaborator-list mt-2 border rounded max-h-40 overflow-y-auto bg-white">
                                            {userList
                                                .filter(user =>
                                                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
                                                )
                                                .slice(0, 5) // Limit search results
                                                .map(user => (
                                                    <li
                                                        key={user._id}
                                                        onClick={() => {
                                                            if (!collaborators.some(c => c._id === user._id)) {
                                                                setCollaborators([...collaborators, user]);
                                                                setSearchQuery("");
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                                    >
                                                        {user.name} {user.email && `(${user.email})`}
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Show selected collaborators */}
                            {collaborators.length > 0 && (
                                <div className="collaborators-list mb-4 flex flex-wrap gap-2">
                                    <div className="w-full text-sm font-medium mb-2">Selected Collaborators:</div>
                                    {collaborators.map(c => (
                                        <span key={c._id} className="tag bg-gray-200 px-2 py-1 rounded-full text-sm flex items-center">
                                            {c.name}
                                            <button 
                                                onClick={() => setCollaborators(collaborators.filter(col => col._id !== c._id))}
                                                className="ml-1 text-gray-500 hover:text-gray-700"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowProjectForm(false)}
                                    className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleProjectSubmit}
                                    className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition-colors"
                                >
                                    Submit Project
                                </button>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading projects...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase size={64} className="mx-auto text-gray-400 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
                            <p className="text-gray-600 mb-6">Create your first project by clicking the Projects button in the sidebar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {projects.map((project) => (
                                <div key={project._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="bg-gray-50 p-4 border-b">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-semibold">{project.name}</h3>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleDeleteProject(project._id)}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Delete project"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                                            {project.type.charAt(0).toUpperCase() + project.type.slice(1)}
                                        </span>
                                    </div>
                                    
                                    <div className="p-4">
                                        <p className="text-gray-600 mb-4">{project.description || "No description provided."}</p>
                                        
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {project.gitlink && (
                                                <a 
                                                    href={project.gitlink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center text-sm text-gray-600 hover:text-primary"
                                                >
                                                    <Github size={16} className="mr-1" />
                                                    GitHub
                                                </a>
                                            )}
                                            
                                            {project.projecturl && (
                                                <a 
                                                    href={project.projecturl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center text-sm text-gray-600 hover:text-primary"
                                                >
                                                    <ExternalLink size={16} className="mr-1" />
                                                    Live Demo
                                                </a>
                                            )}
                                        </div>
                                        
                                        {project.collaborators && project.collaborators.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium mb-2">Collaborators:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.collaborators.map(collab => (
                                                        <div key={collab._id} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                            <img 
                                                                src={collab.profilePicture || "/avatar.png"} 
                                                                alt={collab.name} 
                                                                className="w-4 h-4 rounded-full mr-1"
                                                            />
                                                            {collab.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="text-xs text-gray-500">
                                            Created: {formatDate(project.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectsPage;