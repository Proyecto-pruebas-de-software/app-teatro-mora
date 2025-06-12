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
  Grid,
} from '@mui/material'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Foro() {
  const navigate = useNavigate()

  // Obtener eventos (should always fetch all events for topic selection)
  const { data: eventos, isLoading: isLoadingEventos } = useQuery({
    queryKey: ['eventos', 'all'], // Use a different query key to distinguish from featured events
    queryFn: async () => {
      const response = await axios.get('/api/eventos') // This endpoint currently returns all events
      return response.data.data
    },
    enabled: true, // Always fetch events, as they are used for the main forum categories
  })

  if (isLoadingEventos) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!eventos || eventos.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">No hay eventos disponibles para mostrar foros.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Foros por Evento
      </Typography>
      <Typography variant="h6" gutterBottom>Selecciona un Evento para Ver su Foro</Typography>
      <Grid container spacing={3}>
        {eventos.map((evento) => (
          <Grid item xs={12} sm={6} md={4} key={evento.id}>
            <Card
              onClick={() => navigate(`/foro/${evento.id}`)}
              sx={{
                cursor: 'pointer',
                transition: '0.3s',
                '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
              }}
            >
        <CardContent>
                <Typography variant="h6">{evento.nombre}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Fecha: {new Date(evento.fecha).toLocaleDateString()}
                        </Typography>
        </CardContent>
      </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Foro; 