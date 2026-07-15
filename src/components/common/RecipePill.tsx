import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const RecipePill = styled(Box)(() => ({
  fontSize: 11,
  padding: '4px 8px',
  borderRadius: 6,
  backgroundColor: 'rgba(255,255,255,0.05)',
  color: '#a0a0ab',
  fontWeight: 500,
  '&.cheap': {
    backgroundColor: 'rgba(88,161,92,0.15)',
    color: '#8cd691',
  },
  '&.easy': {
    backgroundColor: 'rgba(242,104,65,0.15)',
    color: '#ff9070',
  },
  '&.healthy': {
    backgroundColor: 'rgba(33,150,243,0.15)',
    color: '#64b5f6',
  }
}));


