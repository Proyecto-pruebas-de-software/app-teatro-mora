import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
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
    imagen_url: ''
  })
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Query for single event
  const { data: evento, isLoading: isLoadingEvento, error: errorEvento } = useQuery({
    queryKey: ['eventos', id],
    queryFn: async () => {
      if (!id) return null
      const response = await axios.get(`/api/eventos/${id}`)
      return response.data.data // Access the data property from the response
    },
    enabled: !!id
  })

  // Query for event list
  const { data: eventos = [], isLoading: isLoadingEventos, error: errorEventos } = useQuery({
    queryKey: ['eventos'],
    queryFn: async () => {
      const response = await axios.get('/api/eventos')
      // Handle both possible response formats
      const eventosData = response.data.data || response.data || []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Filter and sort upcoming events
      return Array.isArray(eventosData) 
        ? eventosData
            .filter(evento => new Date(evento.fecha) >= today)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        : [eventosData]
    },
    enabled: !id
  })

  // Create event mutation
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
        imagen_url: ''
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

  const handleCreateEvent = () => {
    createEventMutation.mutate(nuevoEvento)
  }

  const handleBuyTickets = (evento) => {
    if (evento.vendidos >= evento.aforo) {
      alert('¡Este evento está agotado!')
      return
    }
    
    const saleStartTime = new Date(evento.venta_inicio)
    const now = new Date()
    const oneHourBefore = new Date(saleStartTime.getTime() - 60 * 60 * 1000)
    
    if (now >= oneHourBefore && now < saleStartTime) {
      navigate('/cola')
    } else if (now >= saleStartTime) {
      navigate('/boletos')
    } else {
      alert('La venta de boletos aún no ha comenzado.')
    }
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

  // Single event view
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
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  // Events list view
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
            <InputLabel id="ordenamiento-label">Ordenar por</InputLabel>
            <Select
              labelId="ordenamiento-label"
              value={ordenamiento}
              label="Ordenar por"
              onChange={(e) => setOrdenamiento(e.target.value)}
            >
              <MenuItem value="fecha">Fecha</MenuItem>
              <MenuItem value="nombre">Nombre</MenuItem>
              <MenuItem value="precio">Precio</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title={ordenAscendente ? "Orden ascendente" : "Orden descendente"}>
            <IconButton onClick={toggleOrden} color="primary">
              {ordenAscendente ? <ArrowUpward /> : <ArrowDownward />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {eventosFiltrados.length === 0 ? (
        <Alert severity="info" sx={{ mt: 4 }}>
          No hay eventos disponibles en este momento.
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {eventosFiltrados.map((evento) => (
            <Grid item key={evento.id} xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  backgroundColor: evento.vendidos >= evento.aforo ? '#ffebee' : 'inherit'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {evento.nombre}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    {new Date(evento.fecha).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {evento.descripcion?.length > 100 
                      ? `${evento.descripcion.substring(0, 100)}...` 
                      : evento.descripcion}
                  </Typography>
                  <Box sx={{ mt: 'auto' }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      ${evento.precio}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Disponibles: {evento.aforo - evento.vendidos}
                      </Typography>
                      {evento.vendidos >= evento.aforo ? (
                        <Chip label="Agotado" color="error" size="small" />
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => navigate(`/eventos/${evento.id}`)}
                        >
                          Ver Detalles
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Event Dialog */}
      <Dialog 
        open={dialogoCrearAbierto} 
        onClose={() => setDialogoCrearAbierto(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '60vh',
            maxHeight: '90vh',
            width: { xs: '95%', sm: '80%', md: '60%' }
          }
        }}
      >
        <DialogTitle>Crear Nuevo Evento</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2.5,
            mt: 2,
            '& .MuiTextField-root': {
              width: '100%'
            }
          }}>
            <TextField
              label="Nombre"
              value={nuevoEvento.nombre}
              onChange={(e) => setNuevoEvento({ ...nuevoEvento, nombre: e.target.value })}
              fullWidth
            />
            <TextField
              label="Descripción"
              multiline
              rows={4}
              value={nuevoEvento.descripcion}
              onChange={(e) => setNuevoEvento({ ...nuevoEvento, descripcion: e.target.value })}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Fecha"
                type="date"
                value={nuevoEvento.fecha}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, fecha: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hora"
                type="time"
                value={nuevoEvento.hora}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, hora: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Precio"
                type="number"
                value={nuevoEvento.precio}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, precio: e.target.value })}
                InputProps={{
                  startAdornment: <span>$</span>
                }}
              />
              <TextField
                label="Aforo"
                type="number"
                value={nuevoEvento.aforo}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, aforo: e.target.value })}
              />
            </Box>
            <TextField
              label="URL de la imagen"
              value={nuevoEvento.imagen_url}
              onChange={(e) => setNuevoEvento({ ...nuevoEvento, imagen_url: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogoCrearAbierto(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreateEvent} 
            variant="contained" 
            color="primary"
            disabled={!nuevoEvento.nombre || !nuevoEvento.fecha || !nuevoEvento.hora || !nuevoEvento.precio || !nuevoEvento.aforo}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Eventos 