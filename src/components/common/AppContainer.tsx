import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const AppContainer = styled(Box)(() => ({
  maxWidth: 640,
  margin: '0 auto',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#121214',
  position: 'relative',
  paddingBottom: 80
}));


