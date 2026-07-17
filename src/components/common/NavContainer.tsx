import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const NavContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: 640,
  height: 68,
  zIndex: 100,
  backgroundColor: 'rgba(30, 30, 36, 0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  justifyContent: 'space-around',
  padding: '8px 10px',
  boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
  [theme.breakpoints.up('md')]: {
    maxWidth: 900,
    borderRadius: '16px 16px 0 0',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  }
}));


