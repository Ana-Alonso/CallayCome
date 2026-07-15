import TextField from '@mui/material/TextField';

interface CampoTextoProps {
  etiqueta: string;
  valor: string | number;
  on_change: (valor: string) => void;
  tipo?: string;
  marcador_posicion?: string;
  requerido?: boolean;
  clase_css?: string;
}

export const CampoTexto = ({
  etiqueta,
  valor,
  on_change,
  tipo = 'text',
  marcador_posicion = '',
  requerido = false,
  clase_css = ''
}: CampoTextoProps) => {
  const handle_change = (e: React.ChangeEvent<HTMLInputElement>): void => {
    on_change(e.target.value);
  };

  return (
    <TextField
      label={etiqueta}
      value={valor}
      onChange={handle_change}
      type={tipo}
      placeholder={marcador_posicion}
      required={requerido}
      className={clase_css}
      fullWidth
      variant="outlined"
    />
  );
};
