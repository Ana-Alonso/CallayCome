import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const PageContainer = styled(Box)(() => ({
  padding: 20,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}));


