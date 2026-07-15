import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const ShoppingItemContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  padding: '14px 18px',
  backgroundColor: '#1e1e24',
  border: '1px solid #32323e',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  gap: 12,
  '&:hover': {
    borderColor: '#f26841',
  },
  '&.purchased': {
    opacity: 0.5,
    textDecoration: 'line-through',
    backgroundColor: '#16161c',
  }
}));


