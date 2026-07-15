import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const EmptyState = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  textAlign: 'center',
  backgroundColor: 'rgba(255,255,255,0.01)',
  border: '1px dashed #32323e',
  borderRadius: 16,
  gap: 12,
  marginTop: 20,
}));


