import { styled } from '@mui/material/styles';

export const NavTabButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active?: boolean }>(({ active }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  background: 'none',
  border: 'none',
  color: active ? '#f26841' : '#a0a0ab',
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: active ? 700 : 500,
  transition: 'all 0.2s',
  outline: 'none',
  flexShrink: 0,
  minWidth: 50,
  padding: '2px 4px',
  whiteSpace: 'nowrap',
  '&:hover': {
    color: '#f26841',
  }
}));
