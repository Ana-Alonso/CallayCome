import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const theme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f26841',
      dark: '#d5532d',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#58a15c',
      dark: '#468249',
      contrastText: '#ffffff'
    },
    background: {
      default: '#121214',
      paper: '#1e1e24'
    },
    text: {
      primary: '#f5f5f7',
      secondary: '#a0a0ab'
    },
    divider: '#32323e'
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 800
    },
    h2: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700
    },
    h3: {
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700
    },
    button: {
      fontWeight: 600,
      textTransform: 'none'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 18px'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #32323e',
          backgroundImage: 'none'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #32323e',
          padding: '16px 24px'
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '24px !important'
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#2a2a32',
            '& fieldset': {
              borderColor: '#32323e'
            },
            '&:hover fieldset': {
              borderColor: '#a0a0ab'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f26841'
            }
          }
        }
      }
    }
  }
});

interface ThemeProviderWrapperProps {
  children: React.ReactNode;
}

export const ThemeProviderWrapper = ({ children }: ThemeProviderWrapperProps) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

