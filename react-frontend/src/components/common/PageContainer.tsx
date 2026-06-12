import { ReactNode } from 'react';
import { Box, Container, Typography } from '@mui/material';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

/**
 * Standardized page container component
 * Provides consistent layout, spacing, and typography
 */
export default function PageContainer({
  children,
  title,
  subtitle,
  maxWidth = 'lg',
}: PageContainerProps) {
  return (
    <Box>
      <Container maxWidth={maxWidth} sx={{ py: { xs: 3, md: 4 } }}>
        {/* Page Header */}
        {(title || subtitle) && (
          <Box sx={{ mb: 4 }}>
            {title && (
              <Typography variant="h4" sx={{ fontWeight: 700, mb: subtitle ? 1 : 0 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}

        {/* Page Content */}
        {children}
      </Container>
    </Box>
  );
}
