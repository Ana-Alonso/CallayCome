import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const StatusDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'connected'
})<{ connected?: boolean }>(({ connected }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: connected ? '#58a15c' : '#a0a0ab',
  boxShadow: connected ? '0 0 10px rgba(88,161,92,0.5)' : 'none',
}));


