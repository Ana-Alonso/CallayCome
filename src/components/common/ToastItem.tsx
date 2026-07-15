import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const ToastItem = styled(Box)(() => ({
  backgroundColor: '#1e1e24',
  border: '1px solid #f26841',
  borderLeft: '5px solid #f26841',
  borderRadius: 12,
  padding: '14px 18px',
  color: '#f5f5f7',
  boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
  pointerEvents: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}));


