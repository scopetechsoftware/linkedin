import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { Briefcase, ExternalLink, Github, Trash2, Edit, Plus, Share2 } from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useSocket } from "../../context/SocketContext";

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
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareProjectId, setShareProjectId] = useState(null);
    const [shareSearch, setShareSearch] = useState("");
    const [shareResults, setShareResults] = useState([]);
    const [selectedShareUsers, setSelectedShareUsers] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const { socket } = useSocket();

    // Listen for project_shared event
    React.useEffect(() => {
        if (!socket) return;
        const handler = (data) => {
            toast.success(
                data.sender && data.sender.name
                    ? `${data.sender.name} shared a project with you: ${data.project.name}`
                    : `A project was shared with you: ${data.project.name}`
            );
            // Optionally, you can update state or refetch projects here
        };
        socket.on("project_shared", handler);
        return () => {
            socket.off("project_shared", handler);
        };
    }, [socket]);
    // Share project handler
    const handleShareClick = (projectId) => {
        setShareProjectId(projectId);
        setShowShareModal(true);
        setShareSearch("");
        setShareResults([]);
    };

    // Search users for sharing (show all returned by backend, no filtering)
    const handleShareSearch = async (query) => {
        setShareSearch(query);
        if (!query) {
            setShareResults([]);
            return;
        }
        try {
            const res = await axiosInstance.get(`/users/suggestions?search=${encodeURIComponent(query)}`);
            // No filtering: show all users returned by backend
            setShareResults(res.data);
        } catch (err) {
            setShareResults([]);
        }
    };

    // Toggle user selection for sharing
    const handleToggleShareUser = (user) => {
        setSelectedShareUsers((prev) => {
            if (prev.some((u) => u._id === user._id)) {
                return prev.filter((u) => u._id !== user._id);
            } else {
                return [...prev, user];
            }
        });
    };

    // Fallback function to share project using REST API when socket is not available
    const handleShareWithRestApi = async () => {
        if (!shareProjectId || selectedShareUsers.length === 0) {
            toast.error("Please select a project and at least one user");
            return;
        }

        setIsSending(true);
        try {
            // Make API call to share project
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/projects/${shareProjectId}/share`,
                { userIds: selectedShareUsers.map(user => user._id) },
                { headers: { Authorization: `Bearer ${authUser.token}` } }
            );

            if (response.status === 200) {
                toast.success("Project shared successfully");
                setSelectedShareUsers([]);
                setShowShareModal(false);
            } else {
                toast.error("Failed to share project");
            }
        } catch (error) {
            console.error("Error sharing project via REST API:", error);
            toast.error(error.response?.data?.message || "Failed to share project");
        } finally {
            setIsSending(false);
        }
    };

    // Send project to selected users via socket
    const handleSendShare = () => {
        console.log("handleSendShare called", {
            socketExists: !!socket,
            socketConnected: socket?.connected,
            socketId: socket?.id,
            shareProjectId,
            selectedShareUsers,
        });

        // Debug socket events
        if (socket) {
            console.log("Current socket listeners:", socket._callbacks);
        }
        
        // Check if socket exists
        if (!socket) {
            // Use REST API fallback if socket is not available
            handleShareWithRestApi();
            return;
        }
        
        // Check if socket is connected
        if (!socket.connected) {
            // Try to reconnect the socket
            socket.connect();
            
            // If still not connected, use REST API fallback
            if (!socket.connected) {
                console.log("Socket exists but is not connected to server, using REST API fallback");
                handleShareWithRestApi();
                return;
            }
        }
        if (!shareProjectId) {
            toast.error("No project selected to share");
            return;
        }
        if (selectedShareUsers.length === 0) {
            toast.error("No users selected to share with");
            return;
        }

        // Set loading state
        setIsSending(true);

        // Track successful shares
        let successCount = 0;

        // Listen for success events
        const handleShareSuccess = () => {
            successCount++;
            if (successCount === selectedShareUsers.length) {
                toast.success(`Project shared with ${selectedShareUsers.length} user(s)`);
                setShowShareModal(false);
                setShareProjectId(null);
                setShareSearch("");
                setShareResults([]);
                setSelectedShareUsers([]);
                setIsSending(false);
                // Remove the listener after all shares are processed
                socket.off("project_share_success", handleShareSuccess);
                socket.off("error", handleShareError);
            }
        };

        // Listen for error events
        const handleShareError = (error) => {
            toast.error(error.message || "Failed to share project");
            setIsSending(false);
            // Remove listeners
            socket.off("project_share_success", handleShareSuccess);
            socket.off("error", handleShareError);
        };

        // Add listeners
        socket.on("project_share_success", handleShareSuccess);
        socket.on("error", handleShareError);

        // Send share requests
        selectedShareUsers.forEach((user) => {
            console.log("Emitting share_project", { projectId: shareProjectId, toUserId: user._id });
            socket.emit("share_project", { projectId: shareProjectId, toUserId: user._id });
        });

        // Set a timeout to handle case where server doesn't respond
        setTimeout(() => {
            if (isSending) {
                setIsSending(false);
                socket.off("project_share_success", handleShareSuccess);
                socket.off("error", handleShareError);
                console.log("Socket sharing timed out, using REST API fallback");
                handleShareWithRestApi();
            }
        }, 10000); // 10 second timeout
    };

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
            // formData.append('files', file);

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
                                        multiple
                                        className="w-full p-2 border rounded"
                                        onChange={e => {
                                            const files = Array.from(e.target.files);
                                            setProjectData({ ...projectData, files: files });
                                        }}
                                    />
                                    <small className="text-gray-500 mt-1 block">
                                        All file types are supported
                                    </small>
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
                                                <button
                                                    onClick={() => handleShareClick(project._id)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                    title="Share project"
                                                >
                                                    <Share2 size={18} />
                                                </button>
                                                {/* Share Modal */}
                                                {showShareModal && (
                                                  <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                                                        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
                                                            <button onClick={() => { setShowShareModal(false); setSelectedShareUsers([]); }} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">&times;</button>
                                                            <h2 className="text-xl font-bold mb-4">Share Project</h2>
                                                            <input
                                                                type="text"
                                                                value={shareSearch}
                                                                onChange={e => handleShareSearch(e.target.value)}
                                                                placeholder="Search user by name or email"
                                                                className="w-full border rounded px-2 py-1 mb-3"
                                                                autoFocus
                                                            />
                                                            <ul className="max-h-40 overflow-y-auto mb-3">
                                                                {shareResults.length === 0 && shareSearch && (
                                                                    <li className="text-gray-500 p-2">No users found.</li>
                                                                )}
                                                                {shareResults.map(user => {
                                                                    const isSelected = selectedShareUsers.some(u => u._id === user._id);
                                                                    return (
                                                                        <li
                                                                            key={user._id}
                                                                            className={`p-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between ${isSelected ? 'bg-blue-50' : ''}`}
                                                                            onClick={() => handleToggleShareUser(user)}
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <img src={user.profilePicture?  `http://localhost:5000/uploads/${user.profilePicture}` : "/avatar.png"} alt={user.name} className="w-6 h-6 rounded-full mr-2" />
                                                                                <span>{user.name} {user.email && <span className="text-xs text-gray-500 ml-1">({user.email})</span>}</span>
                                                                            </div>
                                                                            {isSelected && <span className="text-green-600 font-bold ml-2">&#10003;</span>}
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                            <button
                                                                className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark disabled:opacity-50"
                                                                disabled={selectedShareUsers.length === 0 || isSending}
                                                                onClick={handleSendShare}
                                                            >
                                                                {isSending ? "Sending..." : "Share Project"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <span key={i} className={i < Math.round(project.averageRating) ? "text-yellow-500" : "text-gray-300"}>★</span>
                                            ))}
                                            <span className="ml-1 text-sm text-gray-600">
                                                ({project.averageRating ? project.averageRating.toFixed(1) : "0.0"})
                                            </span>
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
                                                                src={collab.profilePicture? `http://localhost:5000/uploads/${collab.profilePicture}` : "/avatar.png"}
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

export default ProjectsPage