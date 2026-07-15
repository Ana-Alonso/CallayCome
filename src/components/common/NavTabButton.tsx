import { styled } from '@mui/material/styles';

export const NavTabButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active?: boolean }>(({ active }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  background: 'none',
  border: 'none',
  color: active ? '#f26841' : '#a0a0ab',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: active ? 600 : 500,
  transition: 'all 0.2s',
  outline: 'none',
  '&:hover': {
    color: '#f26841',
  }
}));


