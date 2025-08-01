import React, { useState, useEffect } from 'react';
import './MedalDisplay.css';

const MedalDisplay = ({ rating, previousRating, className, user }) => {
  const [isNewMedal, setIsNewMedal] = useState(false);
  
  // Check if medal level changed
  useEffect(() => {
    if (previousRating !== null && rating !== null) {
      const previousMedalLevel = getMedalLevel(previousRating);
      const currentMedalLevel = getMedalLevel(rating);
      
      if (previousMedalLevel !== currentMedalLevel && currentMedalLevel > previousMedalLevel) {
        setIsNewMedal(true);
        // Reset the new medal animation after 5 seconds
        const timer = setTimeout(() => setIsNewMedal(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [rating, previousRating]);
  
  // Helper function to determine medal level
  const getMedalLevel = (rating) => {
    if (!rating && rating !== 0) return 0; // No medal
    if (rating >= 4) return 3; // Gold
    if (rating >= 2) return 2; // Silver
    return 1; // Bronze
  };
  
  // Get medal info based on rating
  const getMedalInfo = (rating) => {
    if (!rating && rating !== 0) {
      return { type: 'bronze', label: 'No Medal Yet', color: 'badge-bronze' };
    } else if (rating >= 4) {
      return { type: 'gold', label: 'Gold Medal', color: 'badge-gold' };
    } else if (rating >= 2) {
      return { type: 'silver', label: 'Silver Medal', color: 'badge-silver' };
    } else {
      return { type: 'bronze', label: 'Bronze Medal', color: 'badge-bronze' };
    }
  };
  
  // Only return null if rating is completely missing
  if (rating === null || rating === undefined || rating === '') {
    return null;
  }
  
  const medalInfo = getMedalInfo(rating);
  
  return (
    <div className={`medal-display ${className || ''}`}>
      {/* Only show rating if it's greater than 0 */}
      {rating > 0 && (
        <p className='text-warning text-xs mb-1'>
          ⭐ Average Rating: <strong>{rating.toFixed(1)}</strong>/5
        </p>
      )}
      
      {/* Medal display with animation and tooltip */}
      <div className='medal-container'>
        <img 
          src={`/${medalInfo.type}-medal.svg`} 
          alt={medalInfo.label}
          className={`medal-image ${isNewMedal ? 'new-medal' : ''}`}
        />
        <span className='medal-tooltip'>
          {medalInfo.label}: {rating.toFixed(1)} points
        </span>
      </div>
      
      {/* Medal badge */}
      <div className='flex justify-center'>
        <span className={`medal-badge ${medalInfo.color}`}>
          {medalInfo.label}
        </span>
      </div>
    </div>
  );
};

export default MedalDisplay;