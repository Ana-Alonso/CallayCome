import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const PantryInputGrid = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: 12,
  width: '100%',
}));
