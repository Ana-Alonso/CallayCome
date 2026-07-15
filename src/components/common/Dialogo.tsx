import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import { X } from 'lucide-react';

interface DialogoProps {
  abierto: boolean;
  on_close: () => void;
  titulo: React.ReactNode;
  children: React.ReactNode;
  mostrar_boton_cerrar?: boolean;
}

export const Dialogo = ({
  abierto,
  on_close,
  titulo,
  children,
  mostrar_boton_cerrar = true
}: DialogoProps) => {
  return (
    <Dialog
      open={abierto}
      onClose={on_close}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle className="modal-header">
        <span className="modal-title">{titulo}</span>
        {mostrar_boton_cerrar && (
          <IconButton onClick={on_close} className="modal-close-btn">
            <X />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent className="modal-body">
        {children}
      </DialogContent>
    </Dialog>
  );
};

