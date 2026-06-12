import React, { useState, useEffect } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { getDriverRating } from '../services/ratingService';

interface DriverRatingDisplayProps {
  driverId: string;
  className?: string;
  showTrend?: boolean;
}

export const DriverRatingDisplay: React.FC<DriverRatingDisplayProps> = ({
  driverId,
  className = '',
  showTrend = true,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        setLoading(true);
        const data = await getDriverRating(driverId);
        setRating(Number(data.averageRating));
        setTotalRatings(data.totalRatings);
      } catch (err: any) {
        setError(err.message || 'Failed to load rating');
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [driverId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || rating === 0) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Star size={16} className="text-gray-300" />
        <span className="text-gray-500 text-sm">New</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
        <Star size={16} className="fill-yellow-400 text-yellow-400" />
        <span className="font-semibold text-gray-800">{rating.toFixed(1)}</span>
      </div>
      {showTrend && totalRatings > 0 && (
        <span className="text-xs text-gray-500">
          {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
        </span>
      )}
    </div>
  );
};

// Variant for large display (on ride details page)
export const DriverRatingCard: React.FC<DriverRatingDisplayProps> = ({
  driverId,
  className = '',
}) => {
  const [rating, setRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        setLoading(true);
        const data = await getDriverRating(driverId);
        setRating(Number(data.averageRating));
        setTotalRatings(data.totalRatings);
      } catch (err) {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [driverId]);

  if (loading) {
    return <div className="h-12 bg-gray-200 rounded animate-pulse"></div>;
  }

  if (rating === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-100 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">Driver Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={
                    star <= Math.round(rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
            <span className="font-bold text-lg text-gray-800">{rating.toFixed(1)}</span>
            <span className="text-sm text-gray-600">({totalRatings})</span>
          </div>
        </div>
        {rating >= 4.5 && (
          <div className="flex items-center gap-1 bg-green-100 px-3 py-2 rounded-full">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-xs font-semibold text-green-600">Excellent</span>
          </div>
        )}
      </div>
    </div>
  );
};
