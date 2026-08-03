import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const AppContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 640,
  margin: '0 auto',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#121214',
  position: 'relative',
  paddingTop: 'env(safe-area-inset-top, 0px)',
  paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
  boxSizing: 'border-box',
  [theme.breakpoints.up('md')]: {
    maxWidth: '100%',
    paddingLeft: 40,
    paddingRight: 40,
  }
}));


