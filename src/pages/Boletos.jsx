import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import axios from 'axios'

function Boletos() {
  const [eventoSeleccionado, setEventoSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [dialogoConfirmarAbierto, setDialogoConfirmarAbierto] = useState(false)
  const [errorCompra, setErrorCompra] = useState(null)

  const { data: eventos, isLoading, error } = useQuery({
    queryKey: ['eventos'],
    queryFn: async () => {
      const response = await axios.get('/api/eventos')
      return response.data
    }
  })

  const eventoSeleccionadoData = eventoSeleccionado ? eventos?.find(e => e.id === eventoSeleccionado) : null

  const handleCantidadChange = (e) => {
    const value = parseInt(e.target.value) || 0
    // Máximo 4 boletos por compra
    setCantidad(Math.min(Math.max(1, value), 4))
  }

  const handleCompraClick = () => {
    setErrorCompra(null)
    setDialogoConfirmarAbierto(true)
  }

  const handleConfirmarCompra = async () => {
    try {
      const response = await axios.post('/api/boletos/comprar', {
        eventoId: eventoSeleccionado,
        cantidad: cantidad,
        usuarioId: 'current-user-id', // Reemplazar con ID de usuario real cuando se implemente la autenticación
      })
      
      // Manejar compra exitosa
      window.location.href = `/boletos/confirmacion/${response.data.compraId}`
    } catch (error) {
      setErrorCompra(error.response?.data?.message || 'Error al completar la compra. Por favor, intente nuevamente.')
      setDialogoConfirmarAbierto(false)
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
        Error al cargar los eventos. Por favor, intente nuevamente más tarde.
      </Alert>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Comprar Boletos
      </Typography>

      {errorCompra && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {errorCompra}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Seleccionar Evento
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Evento</InputLabel>
                <Select
                  value={eventoSeleccionado}
                  onChange={(e) => setEventoSeleccionado(e.target.value)}
                  label="Evento"
                >
                  {eventos?.map((evento) => (
                    <MenuItem 
                      key={evento.id} 
                      value={evento.id}
                      disabled={evento.boletosDisponibles === 0}
                    >
                      {evento.nombre} - {new Date(evento.fecha).toLocaleDateString()} a las {evento.hora}
                      {evento.boletosDisponibles === 0 && ' (Agotado)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="h5" gutterBottom>
                Cantidad de Boletos
              </Typography>
              <TextField
                type="number"
                value={cantidad}
                onChange={handleCantidadChange}
                InputProps={{ 
                  inputProps: { 
                    min: 1,
                    max: 4
                  } 
                }}
                helperText="Máximo 4 boletos por compra"
                sx={{ mb: 3 }}
              />

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleCompraClick}
                disabled={!eventoSeleccionado || !eventoSeleccionadoData?.boletosDisponibles}
              >
                Comprar Boletos
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Resumen de Compra
              </Typography>
              {eventoSeleccionadoData && (
                <>
                  <Typography variant="body1" gutterBottom>
                    Evento: {eventoSeleccionadoData.nombre}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Fecha: {new Date(eventoSeleccionadoData.fecha).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Hora: {eventoSeleccionadoData.hora}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Boletos Disponibles: {eventoSeleccionadoData.boletosDisponibles}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Cantidad: {cantidad}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Total: ${(eventoSeleccionadoData.precio * cantidad).toFixed(2)}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={dialogoConfirmarAbierto}
        onClose={() => setDialogoConfirmarAbierto(false)}
      >
        <DialogTitle>Confirmar Compra</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro que deseas comprar {cantidad} boleto{cantidad !== 1 ? 's' : ''} para {eventoSeleccionadoData?.nombre}?
            {'\n'}Total: ${eventoSeleccionadoData ? (eventoSeleccionadoData.precio * cantidad).toFixed(2) : '0.00'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoConfirmarAbierto(false)}>Cancelar</Button>
          <Button onClick={handleConfirmarCompra} variant="contained" color="primary">
            Confirmar Compra
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Boletos 