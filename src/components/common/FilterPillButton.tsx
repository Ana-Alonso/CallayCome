import { styled } from '@mui/material/styles';

export const FilterPillButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active?: boolean }>(({ active }) => ({
  borderRadius: 10,
  border: '1px solid #32323e',
  backgroundColor: active ? '#f26841' : '#2a2a32',
  padding: '10px 8px',
  color: active ? '#ffffff' : '#a0a0ab',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontFamily: 'inherit',
  fontWeight: active ? 600 : 500,
  outline: 'none',
  '&:hover': {
    borderColor: '#f26841',
  },
}));


