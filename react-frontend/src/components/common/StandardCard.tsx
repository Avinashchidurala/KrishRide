import { ReactNode } from 'react';
import { Card, CardContent } from '@mui/material';

interface StandardCardProps {
  children: ReactNode;
  padding?: number;
  elevation?: number;
  sx?: any;
}

/**
 * Standardized card component
 * Provides consistent styling and spacing
 */
export default function StandardCard({
  children,
  padding = 3,
  elevation = 2,
  sx = {},
}: StandardCardProps) {
  return (
    <Card
      elevation={elevation}
      sx={{
        borderRadius: 2,
        mb: 3,
        ...sx,
      }}
    >
      <CardContent sx={{ p: padding }}>
        {children}
      </CardContent>
    </Card>
  );
}

