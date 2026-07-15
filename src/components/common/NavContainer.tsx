import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const NavContainer = styled(Box)(() => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
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
}));


