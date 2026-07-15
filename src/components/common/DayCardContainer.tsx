import { styled } from '@mui/material/styles';
import { CardContainer } from './CardContainer';

export const DayCardContainer = styled(CardContainer, {
  shouldForwardProp: (prop) => prop !== 'destacado',
})<{ destacado?: boolean }>(({ destacado }) => ({
  borderLeft: destacado ? '6px solid #4caf50' : '4px solid #f26841',
  boxShadow: destacado ? '0 0 15px rgba(76, 175, 80, 0.25)' : 'none',
  backgroundColor: destacado ? 'rgba(76, 175, 80, 0.05)' : undefined,
  borderColor: destacado ? '#4caf50 !important' : undefined,
}));


