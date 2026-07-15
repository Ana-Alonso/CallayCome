import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const ToastContainer = styled(Box)(() => ({
  position: 'fixed',
  top: 20,
  left: 20,
  right: 20,
  zIndex: 300,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  pointerEvents: 'none',
  maxWidth: 600,
  margin: '0 auto',
}));


