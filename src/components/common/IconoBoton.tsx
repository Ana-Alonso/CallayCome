import IconButton from '@mui/material/IconButton';

interface IconoBotonProps {
  children: React.ReactNode;
  on_click?: (e: React.MouseEvent) => void;
  clase_css?: string;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

export const IconoBoton = ({
  children,
  on_click,
  clase_css = '',
  color = 'inherit'
}: IconoBotonProps) => {
  return (
    <IconButton
      onClick={on_click}
      className={clase_css}
      color={color}
    >
      {children}
    </IconButton>
  );
};

