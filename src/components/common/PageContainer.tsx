import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const PageContainer = styled(Box)(({ theme }) => ({
  padding: '12px 14px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  width: '100%',
  boxSizing: 'border-box',
  [theme.breakpoints.up('sm')]: {
    padding: 20,
    gap: 20
  }
}));


