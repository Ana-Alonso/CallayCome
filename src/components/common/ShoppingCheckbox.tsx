import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const ShoppingCheckbox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'checked'
})<{ checked?: boolean }>(({ checked }) => ({
  width: 20,
  height: 20,
  borderRadius: 6,
  border: '2px solid #32323e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  backgroundColor: checked ? '#58a15c' : 'transparent',
  borderColor: checked ? '#58a15c' : '#32323e',
  transition: 'all 0.2s',
  '& svg': {
    width: 14,
    height: 14,
    opacity: checked ? 1 : 0,
    transition: 'opacity 0.1s',
  }
}));
