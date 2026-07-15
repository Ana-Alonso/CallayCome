import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const ShoppingSummary = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: 'rgba(255,255,255,0.02)',
  border: '1px solid #32323e',
  borderRadius: 12,
  marginBottom: 16,
}));


