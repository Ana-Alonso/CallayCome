import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const PlannerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 16,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16
  }
}));
