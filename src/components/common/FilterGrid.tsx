import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const FilterGrid = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 8,
}));


