import Button from '@mui/material/Button';

interface BotonProps {
  texto: string;
  on_click?: () => void | Promise<void>;
  tipo?: 'button' | 'submit';
  variante?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  clase_css?: string;
  deshabilitado?: boolean;
  icono?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Boton = ({
  texto,
  on_click,
  tipo = 'button',
  variante = 'contained',
  color = 'primary',
  clase_css = '',
  deshabilitado = false,
  icono,
  style
}: BotonProps) => {
  return (
    <Button
      type={tipo}
      variant={variante}
      color={color}
      onClick={on_click}
      className={clase_css}
      disabled={deshabilitado}
      startIcon={icono}
      style={style}
    >
      {texto}
    </Button>
  );
};
