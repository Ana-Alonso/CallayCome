import { styled } from '@mui/material/styles';

export const SelectControl = styled('select')(() => ({
  width: '100%',
  height: 56,
  padding: '0 14px',
  backgroundColor: '#2a2a32',
  border: '1px solid #32323e',
  borderRadius: 12,
  color: '#f5f5f7',
  fontSize: 15,
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a0a0ab' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  backgroundSize: '16px',
  '&:hover': {
    borderColor: '#a0a0ab',
  },
  '&:focus': {
    borderColor: '#f26841',
  },
}));
