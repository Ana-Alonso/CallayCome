import { styled } from '@mui/material/styles';
import { Box } from './Box';

interface SpacerProps {
  height?: number;
}

export const Spacer = styled(Box)<SpacerProps>(({ height = 20 }) => ({
  height,
  width: '100%',
}));
