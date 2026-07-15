import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const GridTwo = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
}));


