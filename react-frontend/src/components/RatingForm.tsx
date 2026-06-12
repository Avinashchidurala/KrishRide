import React, { useState } from 'react';
import {
  Box,
  Button,
  Rating,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import {
  Star as StarIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { submitRating } from '../services/ratingService';

interface RatingFormProps {
  bookingId: string;
  driverName: string;
  driverPhoto?: string;
  rideRoute: string;
  onRatingSubmitted?: (rating: number, review: string) => void;
  onClose?: () => void;
}

export const RatingForm: React.FC<RatingFormProps> = ({
  bookingId,
  driverName,
  driverPhoto,
  rideRoute,
  onRatingSubmitted,
  onClose,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitRating({
        bookingId,
        rating,
        review: review.trim() || undefined,
      });

      setSuccess(true);
      onRatingSubmitted?.(rating, review);

      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card sx={{ borderRadius: 2, textAlign: 'center', bgcolor: 'success.light' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <StarIcon sx={{ fontSize: 48, color: 'success.main' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'success.dark' }}>
            Thank You!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Your rating has been submitted successfully
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header with driver info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
          {driverPhoto ? (
            <Avatar
              src={driverPhoto}
              alt={driverName}
              sx={{ width: 64, height: 64 }}
            />
          ) : (
            <Avatar sx={{ width: 64, height: 64 }}>
              {driverName.charAt(0)}
            </Avatar>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {driverName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {rideRoute}
            </Typography>
          </Box>
        </Box>

        {/* Rating section */}
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              How was your ride?
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Rating
                size="large"
                value={rating}
                onChange={(_, newValue) => {
                  setRating(newValue || 0);
                }}
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: 'warning.main',
                  },
                  '& .MuiRating-iconHover': {
                    color: 'warning.light',
                  },
                  fontSize: '3rem',
                }}
              />
            </Box>
            {rating > 0 && (
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', fontWeight: 500 }}>
                {rating === 1 && '😞 Poor'}
                {rating === 2 && '😐 Fair'}
                {rating === 3 && '😊 Good'}
                {rating === 4 && '😄 Very Good'}
                {rating === 5 && '😍 Excellent'}
              </Typography>
            )}
          </Box>

          {/* Review section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Add a comment (optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Share your experience with this driver..."
              value={review}
              onChange={(e) => setReview(e.target.value.slice(0, 250))}
              helperText={`${review.length}/250 characters`}
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || rating === 0}
              startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
