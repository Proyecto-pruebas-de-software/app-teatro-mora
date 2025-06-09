import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
} from '@mui/material'
import axios from 'axios'

function Cola() {
  const [enCola, setEnCola] = useState(false)
  const [esMiTurno, setEsMiTurno] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(300) // 5 minutos en segundos
  const [colaAbierta, setColaAbierta] = useState(false)

  const { data: datoCola, isLoading, error } = useQuery({
    queryKey: ['cola'],
    queryFn: async () => {
      const response = await axios.get('/api/cola')
      return response.data
    },
    refetchInterval: 5000 // Actualizar cada 5 segundos
  })

  // Verificar si la cola debe estar abierta (1 hora antes de la venta)
  useEffect(() => {
    const verificarEstadoCola = async () => {
      try {
        const response = await axios.get('/api/eventos/proxima-venta')
        const horaVenta = new Date(response.data.horaInicioVenta)
        const unaHoraAntes = new Date(horaVenta.getTime() - 60 * 60 * 1000)
        setColaAbierta(new Date() >= unaHoraAntes && new Date() < horaVenta)
      } catch (error) {
        console.error('Error al verificar el estado de la cola:', error)
      }
    }
    verificarEstadoCola()
    const intervalo = setInterval(verificarEstadoCola, 60000) // Verificar cada minuto
    return () => clearInterval(intervalo)
  }, [])

  // Temporizador de cuenta regresiva cuando es el turno del usuario
  useEffect(() => {
    let temporizador
    if (esMiTurno && tiempoRestante > 0) {
      temporizador = setInterval(() => {
        setTiempoRestante((prev) => prev - 1)
      }, 1000)
    } else if (tiempoRestante === 0 && esMiTurno) {
      handleTiempoExpirado()
    }
    return () => clearInterval(temporizador)
  }, [esMiTurno, tiempoRestante])

  const handleUnirseACola = async () => {
    try {
      await axios.post('/api/cola', {
        usuarioId: 'id-usuario-actual', // Reemplazar con ID real cuando se implemente la autenticación
        timestamp: new Date().toISOString()
      })
      setEnCola(true)
    } catch (error) {
      alert('Error al unirse a la cola. Por favor, intente nuevamente.')
    }
  }

  const handleTiempoExpirado = async () => {
    try {
      await axios.delete('/api/cola/usuario-actual')
      setEsMiTurno(false)
      setEnCola(false)
      alert('Tu tiempo ha expirado. Puedes volver a unirte a la cola si lo deseas.')
    } catch (error) {
      console.error('Error al manejar la expiración del tiempo:', error)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Error al cargar la información de la cola. Por favor, intente nuevamente más tarde.
      </Alert>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Cola Virtual
      </Typography>

      {!colaAbierta && (
        <Alert severity="info" sx={{ mb: 4 }}>
          La cola está cerrada actualmente. Se abrirá 1 hora antes del inicio de la venta de boletos.
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Estado Actual de la Cola
              </Typography>
              <List>
                {datoCola?.map((entrada, index) => (
                  <div key={entrada.id}>
                    <ListItem>
                      <ListItemText
                        primary={`Posición ${index + 1}`}
                        secondary={new Date(entrada.timestamp).toLocaleString()}
                      />
                      {index === 0 && (
                        <Chip label="Actual" color="primary" sx={{ ml: 2 }} />
                      )}
                    </ListItem>
                    {index < datoCola.length - 1 && <Divider />}
                  </div>
                ))}
              </List>

              {!enCola && colaAbierta && (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleUnirseACola}
                  sx={{ mt: 3 }}
                >
                  Unirse a la Cola
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Información de la Cola
              </Typography>
              <Typography paragraph>
                Longitud Actual: {datoCola?.length || 0} personas
              </Typography>
              <Typography paragraph>
                Tiempo Estimado de Espera: {(datoCola?.length || 0) * 5} minutos
              </Typography>
              {esMiTurno && (
                <>
                  <Typography variant="h6" color="primary" gutterBottom>
                    ¡Es tu turno!
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(tiempoRestante / 300) * 100}
                    sx={{ mb: 1 }}
                  />
                  <Typography>
                    Tiempo restante: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}
                  </Typography>
                </>
              )}
              <Alert severity="info" sx={{ mt: 2 }}>
                {colaAbierta ? 
                  'Tienes 5 minutos para completar tu compra cuando sea tu turno.' :
                  'La cola se abrirá 1 hora antes del inicio de la venta de boletos.'}
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={esMiTurno}
        onClose={() => {}}
        disableEscapeKeyDown
        disableBackdropClick
      >
        <DialogTitle>¡Es tu turno!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tienes 5 minutos para completar tu compra. Tiempo restante: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}
          </DialogContentText>
          <LinearProgress
            variant="determinate"
            value={(tiempoRestante / 300) * 100}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.href = '/boletos'}
          >
            Comprar Boletos Ahora
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Cola 