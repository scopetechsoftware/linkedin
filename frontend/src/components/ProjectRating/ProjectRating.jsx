import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';

const ProjectRating = ({ projectId }) => {
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);

    // Fetch project ratings
    const { data: ratingsData, isLoading } = useQuery({
        queryKey: ['projectRatings', projectId],
        queryFn: async () => {
            const response = await axiosInstance.get(`/api/projects/${projectId}/ratings`);
            return response.data;
        },
        enabled: !!projectId,
    });

    // Submit rating mutation
    const rateProjectMutation = useMutation({
        mutationFn: async ({ rating, comment }) => {
            const response = await axiosInstance.post(`/api/projects/${projectId}/rate`, {
                rating,
                comment
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectRatings', projectId] });
            toast.success('Rating submitted successfully');
            setComment('');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to submit rating');
        },
    });

    const handleSubmitRating = () => {
        if (!rating) {
            toast.error('Please select a rating');
            return;
        }

        rateProjectMutation.mutate({ rating, comment });
    };

    return (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Project Ratings</h3>
            
            {/* Rating input */}
            <div className="mb-4">
                <p className="text-sm font-medium mb-2">Rate this project:</p>
                <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`text-2xl ${star <= (hoveredRating || rating) ? 'text-yellow-500' : 'text-gray-300'}`}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => setRating(star)}
                        >
                            ★
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="ml-2 text-sm text-gray-600">{rating} star{rating !== 1 ? 's' : ''}</span>
                    )}
                </div>
                
                <textarea
                    className="w-full p-2 border rounded-md text-sm"
                    rows="3"
                    placeholder="Add your comments (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                ></textarea>
                
                <button
                    className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                    onClick={handleSubmitRating}
                    disabled={!rating || rateProjectMutation.isPending}
                >
                    {rateProjectMutation.isPending ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
            
            {/* Display existing ratings */}
            {isLoading ? (
                <p className="text-sm text-gray-500">Loading ratings...</p>
            ) : ratingsData?.ratings?.length > 0 ? (
                <div>
                    <div className="flex items-center mb-3">
                        <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span 
                                    key={star} 
                                    className={`text-xl ${star <= Math.round(ratingsData.averageRating) ? 'text-yellow-500' : 'text-gray-300'}`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <span className="ml-2 text-sm font-medium">
                            {ratingsData.averageRating.toFixed(1)} out of 5 ({ratingsData.ratings.length} {ratingsData.ratings.length === 1 ? 'rating' : 'ratings'})
                        </span>
                    </div>
                    
                    <div className="space-y-4 mt-4">
                        {ratingsData.ratings.map((ratingItem) => (
                            <div key={ratingItem._id} className="border-b pb-3">
                                <div className="flex items-center">
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span 
                                                key={star} 
                                                className={`text-sm ${star <= ratingItem.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <span className="ml-2 text-xs text-gray-500">
                                        by {ratingItem.sender.name}
                                    </span>
                                </div>
                                {ratingItem.comment && (
                                    <p className="text-sm mt-1">{ratingItem.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500">No ratings yet. Be the first to rate this project!</p>
            )}
        </div>
    );
};

export default ProjectRating;