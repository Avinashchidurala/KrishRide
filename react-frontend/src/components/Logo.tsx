import { Link } from 'react-router-dom';
import { Box } from '@mui/material';
import images from '../assets/images';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disableLink?: boolean; // Allow disabling the Link wrapper to avoid nested <a> tags
}

const Logo = ({ className = '', showText = false, size = 'md', disableLink = false }: LogoProps) => {
  const sizeStyles = {
    sm: { height: '80px', width: '144px' },
    md: { height: '112px', width: '208px' },
    lg: { height: '144px', width: '256px' },
    xl: { height: '192px', width: '384px' },
  };

  const textSizeStyles = {
    sm: { fontSize: '1.25rem' },
    md: { fontSize: '1.5rem' },
    lg: { fontSize: '2.25rem' },
    xl: { fontSize: '2.25rem' },
  };

  const logoContent = (
    <>
      <img
        src={images.logoNew}
        alt="HushRyd Logo"
        style={{ 
          ...sizeStyles[size], 
          padding: 0, 
          background: 'transparent', 
          objectFit: 'contain',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (!target.src.includes('icon.png')) {
            target.src = images.icon;
          }
        }}
      />
      {showText && (
        <Box component="span" sx={{ fontWeight: 700, color: 'text.primary', ...textSizeStyles[size], transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          HushRyd
        </Box>
      )}
    </>
  );

  if (disableLink) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }} className={className}>
        {logoContent}
      </Box>
    );
  }

  return (
    <Link 
      to="/" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        textDecoration: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className={className}
      onMouseEnter={(e) => {
        const img = e.currentTarget.querySelector('img');
        if (img) {
          img.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        const img = e.currentTarget.querySelector('img');
        if (img) {
          img.style.transform = 'scale(1)';
        }
      }}
    >
      {logoContent}
    </Link>
  );
};

export default Logo;

