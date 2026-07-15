import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const MealSlotContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  backgroundColor: 'rgba(255,255,255,0.02)',
  border: '1px dashed #32323e',
  borderRadius: 10,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'solid',
    borderColor: '#f26841',
  },
  '&.assigned': {
    backgroundColor: '#2a2a32',
    borderStyle: 'solid',
    borderColor: '#32323e',
  }
}));


