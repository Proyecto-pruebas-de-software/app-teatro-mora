import { useState } from 'react'
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
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Report as ReportIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { deepPurple, red } from '@mui/material/colors'
import { useAuth } from '../context/AuthContext'

function Foro() {
  const { user, isAdmin } = useAuth()
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [eventoSeleccionado, setEventoSeleccionado] = useState('')
  const [mensajeEditando, setMensajeEditando] = useState(null)
  const [dialogoReporteAbierto, setDialogoReporteAbierto] = useState(false)
  const [motivoReporte, setMotivoReporte] = useState('')
  const [mensajeSeleccionado, setMensajeSeleccionado] = useState(null)
  const [elementoAncla, setElementoAncla] = useState(null)
  const queryClient = useQueryClient()

  // Obtener eventos
  const { data: eventos } = useQuery({
    queryKey: ['eventos'],
    queryFn: async () => {
      const response = await axios.get('/api/eventos')
      return response.data.data
    }
  })

  // Obtener mensajes con sus reportes
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['mensajes'],
    queryFn: async () => {
      console.log('Fetching messages...')
      const response = await axios.get('/api/mensajes')
      console.log('Messages response:', response.data)
      return response.data.data
    },
    refetchInterval: 10000 // Actualizar cada 10 segundos
  })

  // Estado del menú
  const handleClickMenu = (event, mensaje) => {
    setElementoAncla(event.currentTarget)
    setMensajeSeleccionado(mensaje)
  }

  const handleCerrarMenu = () => {
    setElementoAncla(null)
    setMensajeSeleccionado(null)
  }

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
      await axios.put(`/api/mensajes/${mensajeId}`, { mensaje })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensajes'])
      setMensajeEditando(null)
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
    if (!nuevoMensaje.trim() || !eventoSeleccionado) return

    try {
      await axios.post('/api/mensajes', {
        mensaje: nuevoMensaje,
        evento_id: eventoSeleccionado
      })
      setNuevoMensaje('')
      setEventoSeleccionado('')
      queryClient.invalidateQueries(['mensajes'])
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
        Error loading forum messages. Please try again later.
      </Alert>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Foro del Teatro
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Publicar un Mensaje
          </Typography>
          <form onSubmit={handleEnviar}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Evento</InputLabel>
              <Select
                value={eventoSeleccionado}
                onChange={(e) => setEventoSeleccionado(e.target.value)}
                required
              >
                {eventos?.map((evento) => (
                  <MenuItem key={evento.id} value={evento.id}>
                    {evento.nombre} - {new Date(evento.fecha).toLocaleDateString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Comparte tus pensamientos..."
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!nuevoMensaje.trim() || !eventoSeleccionado}
            >
              Publicar Mensaje
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Mensajes Recientes
          </Typography>
          <List>
            {messages?.map((message, index) => (
              <div key={message.id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <>
                      <IconButton
                        edge="end"
                        aria-label="más"
                        onClick={(e) => handleClickMenu(e, message)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: deepPurple[500] }}>
                      {message.usuario?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span" variant="subtitle1" color="text.primary">
                          {message.usuario || 'Anónimo'}
                        </Typography>
                        {message.role === 'admin' && (
                          <Chip size="small" color="primary" label="Admin" />
                        )}
                        <Typography component="span" variant="body2" color="text.secondary">
                          • {new Date(message.creado_en).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body1"
                          color="text.primary"
                          sx={{ display: 'block', mt: 1 }}
                        >
                          {message.mensaje}
                        </Typography>
                        {message.reportCount > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'warning.main' }}>
                            <ReportIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="caption">
                              {message.reportCount} reporte(s)
                            </Typography>
                          </Box>
                        )}
                      </>
                    }
                  />
                </ListItem>
                {index < messages.length - 1 && <Divider variant="inset" component="li" />}
              </div>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Menu for message actions */}
      <Menu
        anchorEl={elementoAncla}
        open={Boolean(elementoAncla)}
        onClose={handleCerrarMenu}
      >
        {(user?.id === mensajeSeleccionado?.userId || isAdmin) && (
          <MenuItem onClick={() => handleEdit(mensajeSeleccionado)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        {(user?.id === mensajeSeleccionado?.userId || isAdmin) && (
          <MenuItem onClick={() => handleDelete(mensajeSeleccionado.id)}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        )}
        {user?.id !== mensajeSeleccionado?.userId && (
          <MenuItem onClick={handleReport}>
            <ReportIcon fontSize="small" sx={{ mr: 1 }} />
            Reportar
          </MenuItem>
        )}
      </Menu>

      {/* Dialog for editing message */}
      <Dialog
        open={Boolean(mensajeEditando)}
        onClose={() => setMensajeEditando(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar Mensaje</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={mensajeEditando?.mensaje || ''}
            onChange={(e) =>
              setMensajeEditando({
                ...mensajeEditando,
                mensaje: e.target.value,
              })
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMensajeEditando(null)}>Cancelar</Button>
          <Button
            onClick={() =>
              handleEditSubmit(mensajeEditando.id, mensajeEditando.mensaje)
            }
            variant="contained"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for reporting message */}
      <Dialog
        open={dialogoReporteAbierto}
        onClose={() => setDialogoReporteAbierto(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Reportar Mensaje</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Por favor, indique el motivo del reporte:
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={motivoReporte}
            onChange={(e) => setMotivoReporte(e.target.value)}
            placeholder="Describa el motivo del reporte..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoReporteAbierto(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleReportSubmit}
            variant="contained"
            color="warning"
            disabled={!motivoReporte.trim()}
          >
            Enviar Reporte
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Foro 