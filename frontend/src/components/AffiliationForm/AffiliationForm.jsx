import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { Loader, X } from "lucide-react";
import toast from "react-hot-toast";

const AffiliationForm = ({ isOpen, onClose, userRole }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [role, setRole] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const queryClient = useQueryClient();

    // Determine available roles based on user type
    const availableRoles = userRole === "company" 
        ? ["employee", "employer"]
        : ["student", "professor"];

    // Search users query
    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ["userSearch", searchQuery],
        queryFn: async () => {
            if (!searchQuery || searchQuery.length < 2) return [];
            const res = await axiosInstance.get(`/affiliations/search?query=${searchQuery}`);
            return res.data;
        },
        enabled: searchQuery.length >= 2,
    });

    // Create affiliation mutation
    const { mutate: createAffiliation, isLoading: isCreating } = useMutation({
        mutationFn: async (data) => {
            const res = await axiosInstance.post("/affiliations", data);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Affiliation created successfully");
            // Invalidate all affiliation-related queries
            queryClient.invalidateQueries({ queryKey: ["affiliations"] });
            
            // Also invalidate any username-specific affiliation queries
            // This ensures profile pages will refresh with the new data
            queryClient.invalidateQueries({ queryKey: ["userAffiliations"] });
            
            // Get the current user to invalidate their specific queries
            const authUser = queryClient.getQueryData(["authUser"]);
            if (authUser?.username) {
                queryClient.invalidateQueries({ queryKey: ["affiliations", authUser.username] });
                queryClient.invalidateQueries({ queryKey: ["userAffiliations", authUser.username] });
            }
            
            resetForm();
            onClose();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Something went wrong");
        },
    });

    const resetForm = () => {
        setSearchQuery("");
        setSelectedUser(null);
        setRole("");
        setStartDate("");
        setEndDate("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedUser || !role || !startDate) {
            toast.error("Please fill all required fields");
            return;
        }

        createAffiliation({
            affiliatedId: selectedUser._id,
            role,
            startDate,
            endDate: endDate || null,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        {userRole === "company" ? "Add Employee/Employer" : "Add Student/Professor"}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search Users:
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email"
                            className="input input-bordered w-full"
                            disabled={selectedUser || isCreating}
                        />

                        {isSearching && (
                            <div className="flex justify-center my-2">
                                <Loader className="animate-spin" size={20} />
                            </div>
                        )}

                        {searchResults && searchResults.length > 0 && !selectedUser && (
                            <ul className="mt-2 border rounded-md divide-y max-h-40 overflow-y-auto">
                                {searchResults.map((user) => (
                                    <li
                                        key={user._id}
                                        onClick={() => setSelectedUser(user)}
                                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                    >
                                        <img 
                                            src={user.profilePicture ? `http://localhost:5000/uploads/${user.profilePicture}` : "/avatar.png"} 
                                            alt={user.name} 
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {searchResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                            <p className="text-sm text-gray-500 mt-1">No users found</p>
                        )}

                        {selectedUser && (
                            <div className="mt-2 p-2 border rounded-md flex items-center justify-between">
                                <div className="flex items-center">
                                    <img 
                                        src={selectedUser.profilePicture? `http://localhost:5000/uploads/${selectedUser.profilePicture}` : "/avatar.png"} 
                                        alt={selectedUser.name} 
                                        className="w-8 h-8 rounded-full mr-2"
                                    />
                                    <div>
                                        <p className="font-medium">{selectedUser.name}</p>
                                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedUser(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                    disabled={isCreating}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role:
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="select select-bordered w-full"
                            required
                            disabled={isCreating}
                        >
                            <option value="" disabled>Select a role</option>
                            {availableRoles.map((r) => (
                                <option key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date:
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input input-bordered w-full"
                            required
                            disabled={isCreating}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date (Optional):
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input input-bordered w-full"
                            disabled={isCreating}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost mr-2"
                            disabled={isCreating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!selectedUser || !role || !startDate || isCreating}
                        >
                            {isCreating ? <Loader className="animate-spin" size={20} /> : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AffiliationForm;