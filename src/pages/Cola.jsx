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
  IconButton
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Cola() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const eventoId = queryParams.get('eventoId')
  const initialTurno = queryParams.get('turno')

  const { isAuthenticated, user } = useAuth()

  const [enCola, setEnCola] = useState(false)
  const [esMiTurno, setEsMiTurno] = useState(false)
  const [miTurnoNumero, setMiTurnoNumero] = useState(initialTurno ? parseInt(initialTurno) : null)
  const [tiempoRestante, setTiempoRestante] = useState(300)
  const [colaAbierta, setColaAbierta] = useState(false)
  const [eventoData, setEventoData] = useState(null)
  const [longitudCola, setLongitudCola] = useState(null)

  const { data: queueStatus, isLoading: isLoadingQueueStatus, error: errorQueueStatus, refetch: refetchQueueStatus } = useQuery({
    queryKey: ['userQueueStatus', eventoId, user?.id],
    queryFn: async () => {
      if (!eventoId || !user?.id) return null
      const response = await axios.get(`/api/cola_virtual/status/${eventoId}`)
      return response.data.data
    },
    enabled: !!eventoId && !!user?.id,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  // Query to fetch global queue length for the event
  const { data: queueLengthData, isLoading: isLoadingQueueLength, error: errorQueueLength } = useQuery({
    queryKey: ['queueLength', eventoId],
    queryFn: async () => {
      if (!eventoId) return null;
      const response = await axios.get(`/api/cola_virtual/length/${eventoId}`);
      return response.data.data; // Assuming backend returns { data: count }
    },
    enabled: !!eventoId, // Only enable if eventId is available
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    if (queueLengthData !== null) {
      setLongitudCola(queueLengthData);
    }
  }, [queueLengthData]);

  useEffect(() => {
    const fetchEventDetailsAndQueueStatus = async () => {
      if (!eventoId) return
      try {
        const eventResponse = await axios.get(`/api/eventos/${eventoId}`)
        const fetchedEventoData = eventResponse.data.data
        setEventoData(fetchedEventoData)

        const saleStartTime = new Date(fetchedEventoData.venta_inicio)
        const eventDate = new Date(fetchedEventoData.fecha);
        const eventTimeParts = fetchedEventoData.hora.split(':');
        eventDate.setHours(parseInt(eventTimeParts[0]), parseInt(eventTimeParts[1]), 0, 0); // Set actual event time

        const now = new Date()
        const oneHourBeforeSale = new Date(saleStartTime.getTime() - 60 * 60 * 1000)

        const isQueueOpen = (
            now >= oneHourBeforeSale && 
            now < eventDate && // Close queue at event start time
            (fetchedEventoData.vendidos < fetchedEventoData.aforo) // Only if tickets are available
        );
        setColaAbierta(isQueueOpen);

        console.log('Cola.jsx - colaAbierta debug:');
        console.log('  now:', now);
        console.log('  saleStartTime:', saleStartTime);
        console.log('  oneHourBeforeSale:', oneHourBeforeSale);
        console.log('  eventDate (actual event time):', eventDate);
        console.log('  fetchedEventoData.vendidos:', fetchedEventoData.vendidos);
        console.log('  fetchedEventoData.aforo:', fetchedEventoData.aforo);
        console.log('  isQueueOpen (calculated):', isQueueOpen);

      } catch (error) {
        console.error('Error al verificar el estado del evento para la cola:', error.response?.data?.message || error.message)
      }
    }

    fetchEventDetailsAndQueueStatus()
    const interval = setInterval(fetchEventDetailsAndQueueStatus, 60000)
    return () => clearInterval(interval)
  }, [eventoId])

  const handleGoBackToEvent = () => {
    if (eventoId) {
      navigate(`/eventos/${eventoId}`);
    } else {
      navigate('/eventos'); // Fallback if no eventId is present
    }
  };

  useEffect(() => {
    if (queueStatus) {
      setEnCola(queueStatus.status === 'in_queue_waiting' || queueStatus.status === 'in_turn')
      setEsMiTurno(queueStatus.status === 'in_turn')
      setMiTurnoNumero(queueStatus.turno_numero || null)
    }
  }, [queueStatus])

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
    if (!eventoId || !isAuthenticated) {
      alert('Error: ID de evento o autenticación faltante.')
      return
    }
    try {
      const response = await axios.post('/api/cola_virtual/join', { evento_id: eventoId })
      if (response.data.status) {
        alert('Te has unido a la cola exitosamente!')
      setEnCola(true)
        setMiTurnoNumero(response.data.data.turno_numero)
        refetchQueueStatus()
      } else {
        alert('Error al unirse a la cola: ' + (response.data.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error al unirse a la cola:', error.response?.data?.message || error.message)
      alert('Ocurrió un error al unirse a la cola. Por favor, intente de nuevo.')
    }
  }

  const handleTiempoExpirado = async () => {
    try {
      setEsMiTurno(false)
      setEnCola(false)
      setMiTurnoNumero(null)
      alert('Tu tiempo ha expirado. Puedes volver a unirte a la cola si lo deseas.')
    } catch (error) {
      console.error('Error al manejar la expiración del tiempo:', error)
    }
  }

  if (isLoadingQueueStatus || !eventoId || !isAuthenticated) {
    if (!isAuthenticated) {
      return (
        <Container sx={{ mt: 4 }}>
          <Alert severity="info">Por favor, inicia sesión para ver tu estado en la cola.</Alert>
          <Button onClick={() => navigate('/login')} sx={{ mt: 2 }}>
            Ir a Iniciar Sesión
          </Button>
        </Container>
      )
    }
    if (!eventoId) {
      return (
        <Container sx={{ mt: 4 }}>
          <Alert severity="warning">No se especificó un ID de evento para la cola.</Alert>
          <Button onClick={() => navigate('/eventos')} sx={{ mt: 2 }}>
            Volver a Eventos
          </Button>
        </Container>
      )
    }
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (errorQueueStatus) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Error al cargar la información de la cola. Por favor, intente nuevamente más tarde.
      </Alert>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleGoBackToEvent} color="primary" aria-label="regresar">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" component="h1" gutterBottom sx={{ ml: 1 }}>
          Cola Virtual {eventoData?.nombre ? `para ${eventoData.nombre}` : ''}
        </Typography>
      </Box>

      {!colaAbierta && !enCola && (
        <Alert severity="info" sx={{ mb: 4 }}>
          La cola para {eventoData?.nombre || 'este evento'} está cerrada actualmente. Se abrirá 1 hora antes del inicio de la venta de boletos. Venta inicia: {eventoData?.venta_inicio ? new Date(eventoData.venta_inicio).toLocaleString() : 'N/A'}.
        </Alert>
      )}

      {enCola && !esMiTurno && (
         <Alert severity="info" sx={{ mb: 4 }}>
            Estás en la cola. Tu turno es el número {miTurnoNumero}. Por favor, espera a que sea tu turno.
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Tu Estado en la Cola
              </Typography>

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

              {enCola && !esMiTurno && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Tu posición en la cola:
              </Typography>
                  <Typography variant="h4" color="primary">
                    {miTurnoNumero}
              </Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Esperando tu turno. Por favor, mantente en esta página para no perder tu lugar.
              </Typography>
                </Box>
              )}

              {esMiTurno && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    ¡Es tu turno!
                  </Typography>
                  <Typography paragraph>
                    Tienes 5 minutos para completar tu compra.
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(tiempoRestante / 300) * 100}
                    sx={{ mb: 1 }}
                  />
                  <Typography>
                    Tiempo restante: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    fullWidth
                    onClick={() => navigate(`/boletos?eventoId=${eventoId}`)}
                    sx={{ mt: 3 }}
                  >
                    Ir a Comprar Boletos
                  </Button>
                </Box>
              )}

              {!enCola && !colaAbierta && (
                <Typography variant="body1" sx={{ mt: 3, color: 'text.secondary' }}>
                  La cola no está disponible en este momento. 
                </Typography>
              )}

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Detalles del Evento
              </Typography>
              {eventoData ? (
                <>
                  <Typography variant="h6">{eventoData.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">Fecha: {new Date(eventoData.fecha).toLocaleDateString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Hora: {eventoData.hora ? eventoData.hora.substring(0, 5) : 'N/A'}</Typography>
                  <Typography variant="body2" color="text.secondary">Precio: ${eventoData.precio}</Typography>
                  <Typography variant="body2" color="text.secondary">Capacidad: {eventoData.aforo}</Typography>
                  <Typography variant="body2" color="text.secondary">Vendidos: {eventoData.vendidos}</Typography>
                  <Typography variant="body2" color="text.secondary">Venta Inicia: {new Date(eventoData.venta_inicio).toLocaleString()}</Typography>
                </>
              ) : (
                <CircularProgress size={20} />
              )}
            </CardContent>
          </Card>
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Información General de la Cola
              </Typography>
              <Typography paragraph>
                Longitud Actual: {longitudCola !== null ? longitudCola : 'Cargando...'} personas
              </Typography>
              <Typography paragraph>
                Tiempo Estimado de Espera: {longitudCola !== null ? `${longitudCola * 5} minutos` : 'Cargando...'}
              </Typography>
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
        open={esMiTurno && tiempoRestante > 0}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"¡Es tu turno para comprar boletos!"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tienes {Math.floor(tiempoRestante / 60)}:{Math.round(tiempoRestante % 60).toString().padStart(2, '0')} minutos restantes para completar tu compra.
            Serás redirigido a la página de compra de boletos.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate(`/boletos?eventoId=${eventoId}`)} autoFocus>
            Ir a Comprar Boletos
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  )
}

export default Cola 