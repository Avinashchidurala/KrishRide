import { ComponentType } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

interface StatsCardProps {
  icon: ComponentType<{ className?: string; sx?: any }>;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatsCard({ icon: Icon, title, value, subtitle }: StatsCardProps) {
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {value}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

