import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const GridFour = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 10,
}));


