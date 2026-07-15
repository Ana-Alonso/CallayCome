import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const HeaderContainer = styled(Box)(() => ({
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backgroundColor: 'rgba(30, 30, 36, 0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  padding: '16px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));


