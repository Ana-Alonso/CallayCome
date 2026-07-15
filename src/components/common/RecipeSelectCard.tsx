import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const RecipeSelectCard = styled(Box)(() => ({
  backgroundColor: '#2a2a32',
  border: '1px solid #32323e',
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  '&:hover': {
    borderColor: '#f26841',
    backgroundColor: '#32323e',
  }
}));


