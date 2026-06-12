import { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  action?: ReactNode;
}

/**
 * Standardized page header component
 * Provides consistent typography and optional back button
 */
export default function PageHeader({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  action,
}: PageHeaderProps) {
  return (
    <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ flex: 1 }}>
        {showBackButton && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack || (() => window.history.back())}
            sx={{ textTransform: 'none', mb: 2 }}
          >
            Back
          </Button>
        )}
        <Typography variant="h4" sx={{ fontWeight: 700, mb: subtitle ? 1 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
}

