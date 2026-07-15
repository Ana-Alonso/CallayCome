import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const PantryMatchBadge = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'low'
})<{ low?: boolean }>(({ low }) => ({
  fontSize: 11,
  fontWeight: 600,
  padding: '4px 8px',
  borderRadius: 20,
  backgroundColor: low ? 'rgba(242,104,65,0.1)' : 'rgba(88,161,92,0.15)',
  color: low ? '#f26841' : '#8cd691',
}));


