import { styled } from '@mui/material/styles';
import { Box } from './Box';

export const RecipeIngredientsPreview = styled(Box)(() => ({
  fontSize: 12,
  color: '#a0a0ab',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));


