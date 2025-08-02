import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Calendar, Trash2, Users, GraduationCap, Building, XCircle, CheckCircle } from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { format } from "date-fns";

const AffiliationsPage = () => {
    const { data: user } = useQuery({ queryKey: ["authUser"] });
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("created"); // "created" or "affiliated"

    // Get affiliations created by the user
    const { data: createdAffiliations, isLoading: isLoadingCreated } = useQuery({
        queryKey: ["affiliations", "created"],
        queryFn: () => axiosInstance.get("/affiliations"),
    });

    // Get affiliations where the user is affiliated
    const { data: myAffiliations, isLoading: isLoadingAffiliated } = useQuery({
        queryKey: ["affiliations", "affiliated"],
        queryFn: () => axiosInstance.get("/affiliations/my"),
    });

    // Delete affiliation mutation
    const { mutate: deleteAffiliation } = useMutation({
        mutationFn: async (affiliationId) => {
            await axiosInstance.delete(`/affiliations/${affiliationId}`);
        },
        onSuccess: () => {
            toast.success("Affiliation deleted successfully");
            // Invalidate all affiliation-related queries
            queryClient.invalidateQueries({ queryKey: ["affiliations"] });
            
            // Also invalidate any username-specific affiliation queries
            // This ensures profile pages will refresh with the new data
            queryClient.invalidateQueries({ queryKey: ["affiliations", user?.username] });
            queryClient.invalidateQueries({ queryKey: ["userAffiliations"] });
            queryClient.invalidateQueries({ queryKey: ["userAffiliations", user?.username] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete affiliation");
        },
    });
    
    // Toggle affiliation active status mutation
    const { mutate: toggleAffiliationStatus } = useMutation({
        mutationFn: async ({ affiliationId, isActive }) => {
            await axiosInstance.put(`/affiliations/${affiliationId}`, { isActive });
        },
        onSuccess: (_, variables) => {
            const message = variables.isActive ? "Affiliation activated successfully" : "Affiliation deactivated successfully";
            toast.success(message);
            
            // Invalidate all affiliation-related queries
            queryClient.invalidateQueries({ queryKey: ["affiliations"] });
            
            // Also invalidate any username-specific affiliation queries
            // This ensures profile pages will refresh with the new data
            queryClient.invalidateQueries({ queryKey: ["affiliations", user?.username] });
            queryClient.invalidateQueries({ queryKey: ["userAffiliations"] });
            queryClient.invalidateQueries({ queryKey: ["userAffiliations", user?.username] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update affiliation status");
        },
    });

    const handleDeleteAffiliation = (affiliationId) => {
        if (window.confirm("Are you sure you want to delete this affiliation?")) {
            deleteAffiliation(affiliationId);
        }
    };
    
    const handleToggleStatus = (affiliationId, currentStatus) => {
        const newStatus = !currentStatus;
        const message = newStatus 
            ? "Are you sure you want to activate this affiliation?" 
            : "Are you sure you want to deactivate this affiliation?";
            
        if (window.confirm(message)) {
            toggleAffiliationStatus({ affiliationId, isActive: newStatus });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Present";
        return format(new Date(dateString), "MMM yyyy");
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case "student":
            case "professor":
                return <GraduationCap className="mr-2" size={18} />;
            case "employee":
            case "employer":
                return <Building className="mr-2" size={18} />;
            default:
                return <Users className="mr-2" size={18} />;
        }
    };

    const renderAffiliationsList = (affiliations, isCreatedByUser = true) => {
        if (!affiliations?.data || affiliations.data.length === 0) {
            return (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                        {isCreatedByUser 
                            ? "No Affiliations Created" 
                            : "No Affiliations"}
                    </h3>
                    <p className="text-gray-600">
                        {isCreatedByUser
                            ? "You haven't created any affiliations yet."
                            : "You don't have any affiliations with organizations."}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {[...affiliations.data]
                  .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                  .map((affiliation) => {
                    const person = isCreatedByUser ? affiliation.affiliated : affiliation.affiliator;
                    return (
                        <div key={affiliation._id} className={`bg-white rounded-lg shadow p-4 ${!affiliation.isActive ? 'opacity-75' : ''}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center">
                                    <Link to={`/profile/${person.username}`}>
                                        <img
                                            src={person.profilePicture || "/avatar.png"}
                                            alt={person.name}
                                            className="w-12 h-12 rounded-full mr-4 hover:opacity-90 transition-opacity"
                                        />
                                    </Link>
                                    <div>
                                        <div className="flex items-center gap-2">
                                        <Link to={`/profile/${person.username}`} className="hover:text-primary transition-colors">
                                            <h3 className="font-semibold text-lg">{person.name}</h3>
                                        </Link>
                                            {!affiliation.isActive && (
                                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm">{person.headline || person.email}</p>
                                        <div className="flex items-center mt-1 text-sm text-gray-700">
                                            {getRoleIcon(affiliation.role)}
                                            <span className="capitalize">{affiliation.role}</span>
                                        </div>
                                        <div className="flex items-center mt-1 text-sm text-gray-700">
                                            <Calendar className="mr-2" size={16} />
                                            <span>
                                                {formatDate(affiliation.startDate)} - {formatDate(affiliation.endDate)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {isCreatedByUser && (
                                    <div className="flex space-x-2">
                                        {/* Status indicator */}
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            affiliation.isActive 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {affiliation.isActive ? 'Active' : 'Deactivated'}
                                        </div>
                                        
                                        {/* Toggle status button */}
                                        <button
                                            onClick={() => handleToggleStatus(affiliation._id, affiliation.isActive)}
                                            className={`${affiliation.isActive 
                                                ? 'text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100' 
                                                : 'text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100'} 
                                                p-2 rounded-full transition-colors`}
                                            title={affiliation.isActive ? "Deactivate affiliation" : "Activate affiliation"}
                                        >
                                            {affiliation.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                        </button>
                                        
                                        {/* Delete button */}
                                        <button
                                            onClick={() => handleDeleteAffiliation(affiliation._id)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            title="Delete affiliation"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="col-span-1 lg:col-span-1">
                <Sidebar user={user} />
            </div>
            <div className="col-span-1 lg:col-span-3">
                <div className="bg-secondary rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold mb-6">Affiliations</h1>

                    <div className="flex border-b mb-6">
                        <button
                            className={`py-2 px-4 font-medium ${activeTab === "created" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
                            onClick={() => setActiveTab("created")}
                        >
                            Created by Me
                        </button>
                        <button
                            className={`py-2 px-4 font-medium ${activeTab === "affiliated" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
                            onClick={() => setActiveTab("affiliated")}
                        >
                            My Affiliations
                        </button>
                    </div>

                    {activeTab === "created" ? (
                        isLoadingCreated ? (
                            <div className="text-center py-4">Loading...</div>
                        ) : (
                            renderAffiliationsList(createdAffiliations, true)
                        )
                    ) : (
                        isLoadingAffiliated ? (
                            <div className="text-center py-4">Loading...</div>
                        ) : (
                            renderAffiliationsList(myAffiliations, false)
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default AffiliationsPage;