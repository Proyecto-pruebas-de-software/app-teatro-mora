import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { ArrowUpward, ArrowDownward } from '@mui/icons-material'

function Eventos() {
  const { id } = useParams()
  const { isAdmin, isAuthenticated } = useAuth()
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [ordenamiento, setOrdenamiento] = useState('fecha')
  const [ordenAscendente, setOrdenAscendente] = useState(true)
  const [dialogoCrearAbierto, setDialogoCrearAbierto] = useState(false)
  const [nuevoEvento, setNuevoEvento] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    hora: '',
    precio: '',
    aforo: '',
    imagen_url: '',
    venta_inicio: '',
  })
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Consulta para un solo evento
  const { data: evento, isLoading: isLoadingEvento, error: errorEvento } = useQuery({
    queryKey: ['eventos', id],
    queryFn: async () => {
      if (!id) return null
      const response = await axios.get(`/api/eventos/${id}`)
      return response.data.data // Acceder a la propiedad 'data' de la respuesta
    },
    enabled: !!id
  })

  // Consulta para la lista de eventos
  const { data: eventos = [], isLoading: isLoadingEventos, error: errorEventos } = useQuery({
    queryKey: ['eventos'],
    queryFn: async () => {
      const response = await axios.get('/api/eventos')
      // Manejar ambos posibles formatos de respuesta
      const eventosData = response.data.data || response.data || []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Filtrar y ordenar eventos próximos
      const filteredAndSortedEvents = Array.isArray(eventosData) 
        ? eventosData
            .filter(evento => new Date(evento.fecha) >= today)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        : [eventosData]
      
      console.log('Eventos fetched from API:', filteredAndSortedEvents);
      return filteredAndSortedEvents;
    },
    enabled: !id
  })

  // Mutación para crear evento
  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const response = await axios.post('/api/eventos', eventData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['eventos'])
      setDialogoCrearAbierto(false)
      setNuevoEvento({
        nombre: '',
        descripcion: '',
        fecha: '',
        hora: '',
        precio: '',
        aforo: '',
        imagen_url: '',
        venta_inicio: '',
      })
    }
  })

  const eventosFiltrados = eventos?.filter(evento =>
    evento.nombre?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
    evento.descripcion?.toLowerCase().includes(terminoBusqueda.toLowerCase())
  ).sort((a, b) => {
    let comparacion = 0;
    switch (ordenamiento) {
      case 'nombre':
        comparacion = a.nombre.localeCompare(b.nombre);
        break;
      case 'precio':
        comparacion = (parseFloat(a.precio) || 0) - (parseFloat(b.precio) || 0);
        break;
      case 'fecha':
        comparacion = new Date(a.fecha) - new Date(b.fecha);
        break;
      default:
        return 0;
    }
    return ordenAscendente ? comparacion : -comparacion;
  }) || []

  const toggleOrden = () => {
    setOrdenAscendente(!ordenAscendente);
  };

  const handleBuyTickets = async (evento) => {
    if (evento.vendidos >= evento.aforo) {
      alert('¡Este evento está agotado!')
      return
    }

    if (!isAuthenticated) {
      alert('Necesitas iniciar sesión para comprar boletos o unirte a la cola.')
      navigate('/login')
      return;
    }
    
    const saleStartTime = new Date(evento.venta_inicio)
    const now = new Date()
    const oneHourBeforeSale = new Date(saleStartTime.getTime() - 60 * 60 * 1000)

    try {
      const statusResponse = await axios.get(`/api/cola_virtual/status/${evento.id}`);
      const userQueueStatus = statusResponse.data.data.status;
      const userTurno = statusResponse.data.data.turno_numero;

      if (userQueueStatus === 'in_turn') {
        navigate(`/boletos?eventoId=${evento.id}&turno=${userTurno}`);
        return;
      }

      if (userQueueStatus === 'in_queue_waiting') {
        navigate(`/cola?eventoId=${evento.id}&turno=${userTurno}`);
        return;
      }

      if (now < oneHourBeforeSale) {
        alert('La venta de boletos aún no ha comenzado.');
      } else if (now >= oneHourBeforeSale && now < saleStartTime) {
        try {
          const joinResponse = await axios.post('/api/cola_virtual/join', { evento_id: evento.id });
          if (joinResponse.data.success) {
            alert('Te has unido a la cola virtual. Serás redirigido a la página de la cola.');
            navigate(`/cola?eventoId=${evento.id}&turno=${joinResponse.data.data.turno_numero}`);
          } else {
            alert('No se pudo unir a la cola: ' + (joinResponse.data.message || 'Error desconocido'));
          }
        } catch (error) {
          console.error('Error al unirse a la cola:', error.response?.data?.message || error.message);
          alert('Error al unirse a la cola. Por favor, intente de nuevo.');
        }
      } else if (now >= saleStartTime) {
        navigate(`/boletos?eventoId=${evento.id}`);
      } else {
        alert('La venta de boletos aún no ha comenzado.');
      }
    } catch (error) {
      console.error('Error en handleBuyTickets o al verificar estado de cola:', error.response?.data?.message || error.message);
      alert('Ocurrió un error al procesar tu solicitud. Por favor, intente más tarde.');
    }
  }

  const handleCreateEvent = () => {
    // Basic client-side validation for required fields before sending
    if (!nuevoEvento.nombre || !nuevoEvento.fecha || !nuevoEvento.hora || nuevoEvento.precio === '' || nuevoEvento.aforo === '' || !nuevoEvento.venta_inicio) {
      alert('Por favor, complete todos los campos requeridos (Nombre, Fecha, Hora, Precio, Aforo, Fecha de Inicio de Venta).');
      return;
    }

    // Ensure numeric fields are converted
    const eventDataToSend = {
      ...nuevoEvento,
      precio: parseFloat(nuevoEvento.precio),
      aforo: parseInt(nuevoEvento.aforo, 10),
    };
    
    // Generate a Picsum image URL if imagen_url is empty
    if (!eventDataToSend.imagen_url) {
      const randomImageId = Math.floor(Math.random() * 1000); // Picsum has many IDs
      eventDataToSend.imagen_url = `https://picsum.photos/id/${randomImageId}/1200/675`; 
    }

    createEventMutation.mutate(eventDataToSend);
  }

  if (isLoadingEvento || isLoadingEventos) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (errorEvento || errorEventos) {
    const error = errorEvento || errorEventos
    console.error('Detalles del error:', error)
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Error al cargar los eventos. Por favor, intente más tarde.
        {error.response?.data?.message && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error.response.data.message}
          </Typography>
        )}
      </Alert>
    )
  }

  // Vista de un solo evento
  if (id && evento) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Box sx={{ mt: 4 }}>
          <Button onClick={() => navigate('/eventos')} sx={{ mb: 2 }}>
            ← Volver a Eventos
          </Button>
          <Card>
            <CardContent>
              <Typography variant="h3" component="h1" gutterBottom>
                {evento.nombre}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Fecha: {new Date(evento.fecha).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" paragraph>
                {evento.descripcion}
              </Typography>
              <Typography variant="h5" color="primary" gutterBottom>
                Precio: ${evento.precio || 'Por determinar'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Typography variant="body1">
                  Capacidad: {evento.vendidos} / {evento.aforo}
                </Typography>
                {evento.vendidos >= evento.aforo ? (
                  <Chip label="Agotado" color="error" />
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => handleBuyTickets(evento)}
                  >
                    Comprar Boletos
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  sx={{ ml: 2 }}
                  onClick={() => navigate(`/foro/${evento.id}?from=eventos_detail`)}
                >
                  Ir al Foro
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  // Vista de la lista de eventos
  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h2" component="h1">
          Eventos del Teatro
        </Typography>
        {isAuthenticated && isAdmin && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setDialogoCrearAbierto(true)}
          >
            Crear Evento
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Buscar eventos"
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="ordenar-por-label">Ordenar Por</InputLabel>
            <Select
              labelId="ordenar-por-label"
              id="ordenar-por"
              value={ordenamiento}
              label="Ordenar Por"
              onChange={(e) => setOrdenamiento(e.target.value)}
            >
              <MenuItem value="fecha">Fecha</MenuItem>
              <MenuItem value="nombre">Nombre</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={toggleOrden} color="primary">
            {ordenAscendente ? <ArrowUpward /> : <ArrowDownward />}
          </IconButton>
        </Box>
      </Box>

      {eventosFiltrados.length === 0 && !isLoadingEventos ? (
        <Alert severity="info" sx={{ mt: 4 }}>
          No hay eventos próximos disponibles.
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {eventosFiltrados.map((evento) => {
            console.log(`Evento ID: ${evento.id}, Nombre: ${evento.nombre}, Imagen URL:`, evento.imagen_url);
            return (
            <Grid item key={evento.id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={evento.imagen_url || '/placeholder_event.jpg'}
                  alt={evento.nombre}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    {evento.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fecha: {new Date(evento.fecha).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hora: {evento.hora ? evento.hora.substring(0, 5) : 'N/A'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ mt: 'auto' }}>
                  <Button size="small" onClick={() => navigate(`/eventos/${evento.id}`)}>
                    Más Información
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            )
          })}
        </Grid>
      )}

      {/* Dialogo para crear evento */}
      <Dialog open={dialogoCrearAbierto} onClose={() => setDialogoCrearAbierto(false)}>
        <DialogTitle>Crear Nuevo Evento</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            label="Nombre del Evento"
            type="text"
            fullWidth
            value={nuevoEvento.nombre}
            onChange={(e) => setNuevoEvento({ ...nuevoEvento, nombre: e.target.value })}
          />
          <TextField
            margin="dense"
            id="descripcion"
            label="Descripción"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={nuevoEvento.descripcion}
            onChange={(e) => setNuevoEvento({ ...nuevoEvento, descripcion: e.target.value })}
          />
          <TextField
            margin="dense"
            id="fecha"
            label="Fecha"
            type="date"
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            value={nuevoEvento.fecha}
            onChange={(e) => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })}
          />
          <TextField
            margin="dense"
            id="hora"
            label="Hora (HH:MM)"
            type="time"
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            value={nuevoEvento.hora}
            onChange={(e) => setNuevoEvento({ ...nuevoEvento, hora: e.target.value })}
          />
          <TextField
            margin="dense"
            id="precio"
            label="Precio"
            type="number"
            fullWidth
            value={nuevoEvento.precio}
            onChange={(e) => setNuevoEvento({ ...nuevoEvento, precio: e.target.value })}
          />
          <TextField
            margin="dense"
            id="aforo"
            label="Aforo (Capacidad)"
            type="number"
            fullWidth
            value={nuevoEvento.aforo}
            onChange={(e) => setNuevoEvento({ ...nuevoEvento, aforo: e.target.value })}
          />
          <TextField
            margin="dense"
            id="imagen_url"
            label="URL de la Imagen"
            type="url"
            fullWidth
            value={nuevoEvento.imagen_url}
            onChange={(e) => setNuevoEvento({ ...nuevoEvento, imagen_url: e.target.value })}
          />
          <TextField
            margin="dense"
            id="venta_inicio"
            label="Fecha y Hora de Inicio de Venta"
            type="datetime-local"
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            value={nuevoEvento.venta_inicio}
            onChange={(e) => setNuevoEvento({ ...nuevoEvento, venta_inicio: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoCrearAbierto(false)}>Cancelar</Button>
          <Button onClick={handleCreateEvent} color="primary">
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Eventos 