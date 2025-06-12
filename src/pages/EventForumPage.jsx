import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Grid,
  Fab,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Report as ReportIcon,
  Reply as ReplyIcon,
  AddComment as AddCommentIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { deepPurple, red } from '@mui/material/colors'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

// Function to format time difference (e.g., "2 hours ago", "3 days ago")
const formatTimeDifference = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffSeconds = Math.floor((now - past) / 1000);

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const month = day * 30.44; // Average days in a month
  const year = day * 365.25; // Average days in a year

  if (diffSeconds < minute) {
    return `${diffSeconds} segundos atrás`;
  } else if (diffSeconds < hour) {
    const minutes = Math.floor(diffSeconds / minute);
    return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
  } else if (diffSeconds < day) {
    const hours = Math.floor(diffSeconds / hour);
    return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
  } else if (diffSeconds < month) {
    const days = Math.floor(diffSeconds / day);
    return `${days} día${days > 1 ? 's' : ''} atrás`;
  } else if (diffSeconds < year) {
    const months = Math.floor(diffSeconds / month);
    return `${months} mes${months > 1 ? 'es' : ''} atrás`;
  } else {
    const years = Math.floor(diffSeconds / year);
    return `${years} año${years > 1 ? 's' : ''} atrás`;
  }
};

function EventForumPage() {
  const { user, isAdmin } = useAuth()
  console.log('EventForumPage component: User', user, 'isAdmin', isAdmin)
  const { eventoId: paramEventoId } = useParams()
  console.log('EventForumPage component: paramEventoId from useParams:', paramEventoId, 'Type:', typeof paramEventoId)
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [mensajeEditando, setMensajeEditando] = useState(null)
  const [dialogoReporteAbierto, setDialogoReporteAbierto] = useState(false)
  const [motivoReporte, setMotivoReporte] = useState('')
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState(null)
  const [elementoAncla, setElementoAncla] = useState(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const cameFromEventDetail = queryParams.get('from') === 'eventos_detail'

  // State for forum navigation within this specific event forum
  const [selectedTopicEventId, setSelectedTopicEventId] = useState(paramEventoId || null); // Always starts with paramEventoId
  const [selectedParentMessageId, setSelectedParentMessageId] = useState(null); // null for top-level posts, ID for replies
  const [currentParentMessage, setCurrentParentMessage] = useState(null); // Stores the parent message object when viewing replies
  const [mensajeError, setMensajeError] = useState(''); // New state for input validation error

  // Obtener el nombre del evento para el título
  const { data: eventoDetalle, isLoading: isLoadingEventoDetalle } = useQuery({
    queryKey: ['eventoDetalle', selectedTopicEventId],
    queryFn: async () => {
      if (!selectedTopicEventId) return null;
      const response = await axios.get(`/api/eventos/${selectedTopicEventId}`);
      return response.data.data;
    },
    enabled: Boolean(selectedTopicEventId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Obtener mensajes (posts or replies)
  const { data: messages, isLoading: isLoadingMessages, error: isErrorMessages } = useQuery({
    queryKey: ['mensajes', selectedTopicEventId, selectedParentMessageId],
    queryFn: async () => {
      let url = '/api/mensajes';
      const queryParams = new URLSearchParams();

      if (selectedParentMessageId) {
        // Fetch replies for a specific parent message
        queryParams.append('parent_id', selectedParentMessageId);
      } else if (selectedTopicEventId) {
        // Fetch top-level messages for a specific event topic
        queryParams.append('evento_id', selectedTopicEventId);
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      console.log('EventForumPage component: API URL for messages:', url); // Essential log
      const response = await axios.get(url)
      return response.data.data
    },
    refetchInterval: 10000,
    // Ensure this query is enabled only when we have a selected event or a parent message
    enabled: Boolean(selectedTopicEventId || selectedParentMessageId),
  })

  // Handle initial paramEventoId for direct links to event forums AND internal navigation
  useEffect(() => {
    if (paramEventoId) {
      setSelectedTopicEventId(paramEventoId);
      // Also reset reply view when navigating to a new event forum
      setSelectedParentMessageId(null);
      setCurrentParentMessage(null);
      setNuevoMensaje(''); // Clear message input when changing topics
    }
    // No else if (!paramEventoId && selectedTopicEventId) because this component
    // always expects a paramEventoId. Navigation to general forum is handled by App.jsx
  }, [paramEventoId]); // Re-run effect when paramEventoId changes

  // Estado del menú
  const handleClickMenu = (event, mensaje) => {
    setElementoAncla(event.currentTarget)
    setMensajeSeleccionado(mensaje)
  }

  const handleCerrarMenu = () => {
    setElementoAncla(null)
    setMensajeSeleccionado(null)
  }

  // New handleReply function
  const handleReply = (message) => {
    setSelectedParentMessageId(message.id);
    setCurrentParentMessage(message); // Store the message object
    setNuevoMensaje(''); // Clear message input
  };

  // Mutación para eliminar mensaje
  const mutacionEliminar = useMutation({
    mutationFn: async (mensajeId) => {
      await axios.delete(`/api/mensajes/${mensajeId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensajes'])
      handleCerrarMenu()
    }
  })

  // Mutación para editar mensaje
  const mutacionEditar = useMutation({
    mutationFn: async ({ mensajeId, mensaje }) => {
      console.log(`Sending PUT request to /api/mensajes/${mensajeId} with message:`, mensaje);
      const response = await axios.put(`/api/mensajes/${mensajeId}`, { mensaje });
      console.log('Update message API response:', response.data);
      return response.data; // Return data from the mutation
    },
    onMutate: (variables) => {
        console.log('Mutation para editar mensaje: onMutate', variables);
    },
    onError: (error, variables, context) => {
        console.error('Mutation para editar mensaje: onError', error.response?.data || error.message, variables, context);
        alert('Error al actualizar el mensaje. Por favor, intente de nuevo.');
    },
    onSuccess: (data, variables, context) => {
      console.log('Mutation para editar mensaje: onSuccess', data, variables, context);
      queryClient.invalidateQueries(['mensajes'])
      setMensajeEditando(null)
      setNuevoMensaje(''); // Clear the input field after successful edit
      setMensajeError(''); // Clear any message input error
    }
  })

  // Mutación para reportar mensaje
  const mutacionReportar = useMutation({
    mutationFn: async ({ mensajeId, motivo }) => {
      await axios.post(`/api/mensajes/${mensajeId}/reportar`, { motivo })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensajes'])
      setDialogoReporteAbierto(false)
      setMotivoReporte('')
    }
  })

  const handleEnviar = async (e) => {
    e.preventDefault()

    if (!nuevoMensaje.trim()) {
      setMensajeError('El mensaje no puede estar vacío.');
      return;
    }
    if (nuevoMensaje.trim().length < 5) {
      setMensajeError('El mensaje debe tener al menos 5 caracteres.');
      return;
    }
    if (!selectedTopicEventId) { // Changed this condition
      setMensajeError('Debe seleccionar un evento para publicar un mensaje.');
      return;
    }

    setMensajeError(''); // Clear previous errors

    try {
      const postData = {
        mensaje: nuevoMensaje,
        evento_id: selectedTopicEventId, // Always associate with the current topic/event
        parent_mensaje_id: selectedParentMessageId || null, // Include parent_mensaje_id if it exists
      };

      await axios.post('/api/mensajes', postData)
      setNuevoMensaje('')
      queryClient.invalidateQueries(['mensajes'])
      // After posting a reply, stay in the reply view (optional: navigate back to top-level posts after reply)
      // if (selectedParentMessageId) { setSelectedParentMessageId(null); } // Uncomment to go back after reply
    } catch (error) {
      console.error('Error al publicar el mensaje:', error)
      alert('Error al publicar el mensaje. Por favor, intente nuevamente.')
    }
  }

  const handleDelete = (mensajeId) => {
    mutacionEliminar.mutate(mensajeId)
  }

  const handleEdit = (mensaje) => {
    setMensajeEditando(mensaje)
    handleCerrarMenu()
  }

  const handleEditSubmit = (mensajeId, mensaje) => {
    mutacionEditar.mutate({ mensajeId, mensaje })
  }

  const handleReport = () => {
    setDialogoReporteAbierto(true)
    handleCerrarMenu()
  }

  const handleReportSubmit = () => {
    if (mensajeSeleccionado && motivoReporte) {
      mutacionReportar.mutate({
        mensajeId: mensajeSeleccionado.id,
        motivo: motivoReporte
      })
    }
  }

  if (isLoadingEventoDetalle || isLoadingMessages) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isErrorMessages) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Error al cargar los mensajes del foro.</Alert>
      </Container>
    );
  }

  // Render top-level topics for a specific event
  if (selectedTopicEventId && !selectedParentMessageId) {
    console.log('Rendering event forum:', {
      selectedTopicEventId,
      eventoDetalle: eventoDetalle,
      foundEventName: eventoDetalle?.nombre
    });
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Foro del Evento: {eventoDetalle?.nombre || 'Cargando...'}
          </Typography>
          
            <Button
              variant="outlined"
              onClick={() => navigate(`/eventos/${selectedTopicEventId}`)}
              sx={{ mr: 1 }}
            >
              Volver al Evento
            </Button>
          
          <Button
            variant="outlined"
            onClick={() => {
              navigate('/foro'); // Navigate back to the general forum list
            }}
          >
            Volver a la Lista de Foros
          </Button>
        </Box>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Crear un Nuevo Tema</Typography>
            <form onSubmit={handleEnviar}>
              <TextField
                label="Título del Tema (Tu Mensaje Inicial)"
                multiline
                rows={4}
                fullWidth
                value={nuevoMensaje}
                onChange={(e) => {
                  setNuevoMensaje(e.target.value);
                  if (e.target.value.trim().length >= 5) {
                    setMensajeError('');
                  }
                }}
                variant="outlined"
                sx={{ mb: 2 }}
                required
                error={Boolean(mensajeError)}
                helperText={mensajeError}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!nuevoMensaje.trim() || Boolean(mensajeError)}
              >
                Publicar Tema
              </Button>
            </form>
          </CardContent>
        </Card>

        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>Temas del Evento</Typography>
        <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}>
          <ListItem sx={{ bgcolor: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}><Typography variant="subtitle1" fontWeight="bold">Tema</Typography></Grid>
              <Grid item xs={2}><Typography variant="subtitle1" fontWeight="bold">Respuestas</Typography></Grid>
              <Grid item xs={2}><Typography variant="subtitle1" fontWeight="bold">Autor</Typography></Grid>
              <Grid item xs={2}><Typography variant="subtitle1" fontWeight="bold">Última Publicación</Typography></Grid>
            </Grid>
          </ListItem>
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id}>
                <ListItem
                  alignItems="flex-start"
                  button
                  onClick={() => {
                    setSelectedParentMessageId(message.id);
                    setCurrentParentMessage(message);
                    setNuevoMensaje(''); // Clear message input
                    setMensajeError(''); // Clear validation error
                  }}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6}>
                      <ListItemText
                        primary={
                          <Typography
                            component="span"
                            variant="body1"
                            color="text.primary"
                            fontWeight="bold"
                          >
                            {message.mensaje} {/* Topic is the initial message */}
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2" color="text.secondary">
                        {message.replies_count !== undefined ? message.replies_count : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2" color="text.secondary">
                        {message.usuario_nombre}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2" color="text.secondary">
                        {message.last_post_date ? formatTimeDifference(message.last_post_date) : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </ListItem>
                <Divider variant="inset" component="li" />
              </div>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No hay temas para este evento aún. ¡Sé el primero en publicar!" />
            </ListItem>
          )}
        </List>
      </Container>
    );
  }

  // Render messages (general forum or replies to a parent message)
  if (selectedParentMessageId) { // Only render this if we are viewing replies
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Respuestas a: "{currentParentMessage?.mensaje}"
          </Typography>
          <IconButton
            onClick={() => {
              setSelectedParentMessageId(null);
              setCurrentParentMessage(null);
              setNuevoMensaje('');
              setMensajeError('');
            }}
            size="small"
            sx={{ ml: 1 }}
          >
            <Chip label="Volver al Tema" onDelete={() => { /* No-op, handled by onClick */ }} />
          </IconButton>
        </Box>

        {currentParentMessage && (
          <Card sx={{ mb: 4, bgcolor: deepPurple[50] }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>Mensaje Original</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {currentParentMessage.mensaje}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Por {currentParentMessage.usuario_nombre} el {new Date(currentParentMessage.creado_en).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        )}

        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: deepPurple[500] }}>
                      {message.usuario_nombre ? message.usuario_nombre.charAt(0) : 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        component="span"
                        variant="subtitle1"
                        color="text.primary"
                      >
                        {message.usuario_nombre}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          {new Date(message.creado_en).toLocaleString()}
                        </Typography>
                        {(isAdmin || user?.id === message.usuario_id || user?.id !== message.usuario_id) && (
                          <Box component="span" sx={{ ml: 1 }}>
                            <IconButton
                              aria-label="settings"
                              onClick={(event) => {
                                setElementoAncla(event.currentTarget);
                                setMensajeSeleccionado(message);
                              }}
                              size="small"
                            >
                              <MoreVertIcon />
                            </IconButton>
                            <Menu
                              anchorEl={elementoAncla}
                              open={Boolean(elementoAncla && mensajeSeleccionado?.id === message.id)}
                              onClose={() => setElementoAncla(null)}
                            >
                              {(isAdmin || user?.id === message.usuario_id) && (
                                <MenuItem onClick={() => {
                                  setMensajeEditando(mensajeSeleccionado);
                                  setNuevoMensaje(mensajeSeleccionado.mensaje);
                                  setElementoAncla(null);
                                }}>
                                  <EditIcon fontSize="small" sx={{ mr: 1 }} /> Editar
                                </MenuItem>
                              )}
                              {(isAdmin || user?.id === message.usuario_id) && (
                                <MenuItem onClick={() => {
                                  handleDelete(mensajeSeleccionado.id);
                                  setElementoAncla(null);
                                }}>
                                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Eliminar
                                </MenuItem>
                              )}
                              {(isAdmin || (user && user.id !== message.usuario_id)) && (
                                <MenuItem onClick={() => {
                                  setDialogoReporteAbierto(true);
                                  setElementoAncla(null);
                                }}>
                                  <ReportIcon fontSize="small" sx={{ mr: 1 }} /> Reportar
                                </MenuItem>
                              )}
                            </Menu>
                          </Box>
                        )}
                      </Typography>
                    }
                    secondary={
                      mensajeEditando && mensajeEditando.id === message.id ? (
                        <Box component="form" onSubmit={() => handleEditSubmit(mensajeEditando.id, nuevoMensaje)} sx={{ mt: 1 }}>
                          <TextField
                            label="Editar Mensaje"
                            multiline
                            rows={3}
                            fullWidth
                            value={nuevoMensaje}
                            onChange={(e) => {
                              setNuevoMensaje(e.target.value);
                              if (e.target.value.trim().length >= 5) {
                                setMensajeError('');
                              }
                            }}
                            variant="outlined"
                            sx={{ mb: 1 }}
                            required
                            error={Boolean(mensajeError)} // Apply error style
                            helperText={mensajeError}
                          />
                          <Button type="submit" variant="contained" size="small" sx={{ mr: 1 }}>Guardar</Button>
                          <Button type="button" variant="outlined" size="small" onClick={() => {
                            setMensajeEditando(null);
                            setNuevoMensaje('');
                            setMensajeError('');
                          }}>Cancelar</Button>
                        </Box>
                      ) : (
                        message.mensaje
                      )
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </div>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No hay mensajes para mostrar." />
            </ListItem>
          )}
        </List>

        {/* Message input for general forum or replies */}
        <Card sx={{ mt: 4, mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>{selectedParentMessageId ? 'Tu Respuesta' : 'Nuevo Mensaje'}</Typography>
            <form onSubmit={handleEnviar}>
              <TextField
                label={selectedParentMessageId ? 'Tu Respuesta' : 'Tu Mensaje'}
                multiline
                rows={3}
                fullWidth
                value={nuevoMensaje}
                onChange={(e) => {
                  setNuevoMensaje(e.target.value);
                  if (e.target.value.trim().length >= 5) {
                    setMensajeError('');
                  }
                }}
                variant="outlined"
                sx={{ mb: 2 }}
                required
                error={Boolean(mensajeError)}
                helperText={mensajeError}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!nuevoMensaje.trim() || Boolean(mensajeError)}
              >
                {selectedParentMessageId ? 'Publicar Respuesta' : 'Publicar Mensaje'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Report Dialog */}
        <Dialog open={dialogoReporteAbierto} onClose={() => setDialogoReporteAbierto(false)}>
          <DialogTitle>Reportar Mensaje</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Por favor, describe el motivo del reporte para el mensaje:
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Motivo del Reporte"
              type="text"
              fullWidth
              variant="standard"
              value={motivoReporte}
              onChange={(e) => setMotivoReporte(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogoReporteAbierto(false)}>Cancelar</Button>
            <Button onClick={handleReportSubmit} disabled={!motivoReporte.trim()}>Reportar</Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // This should theoretically not be reached if routing is set up correctly for /foro/:eventoId
  // but acts as a fallback or if selectedTopicEventId is null unexpectedly.
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Error: Evento de Foro no Seleccionado
      </Typography>
      <Typography variant="body1">
        Por favor, selecciona un evento desde la lista de foros para ver sus mensajes.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/foro')} sx={{ mt: 2 }}>
        Ir a la Lista de Foros
      </Button>
    </Container>
  );
}

export default EventForumPage; 