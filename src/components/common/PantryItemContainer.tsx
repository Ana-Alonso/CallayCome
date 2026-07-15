import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const PantryItemContainer = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#1e1e24',
  border: '1px solid #32323e',
  borderRadius: 12,
}));


