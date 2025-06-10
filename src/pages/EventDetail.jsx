import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: evento, isLoading, error } = useQuery({
    queryKey: ['eventoDetalle', id],
    queryFn: async () => {
      const response = await axios.get(`/api/eventos/${id}`);
      return response.data.data;
    },
    enabled: !!id, // Only run the query if an ID is present
  });

  // Log the event data when it's fetched
  if (evento) {
    console.log('Event details fetched:', evento);
  }

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          Error al cargar los detalles del evento. Por favor, intente más tarde.
        </Alert>
      </Container>
    );
  }

  if (!evento) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">Evento no encontrado.</Alert>
        <Button onClick={() => navigate('/eventos')} sx={{ mt: 2 }}>
          Volver a la lista de eventos
        </Button>
      </Container>
    );
  }

  // Placeholder function for buying tickets, linking to /cola
  const handleBuyTickets = () => {
    // You might want to pass evento.id or other details to the /cola page
    navigate('/cola');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button onClick={() => navigate('/eventos')} sx={{ mb: 3 }}>
        ← Volver a Eventos
      </Button>

      <Card sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, mb: 4 }}>
        <CardMedia
          component="img"
          sx={{ width: { xs: '100%', md: 600 }, maxHeight: 400, objectFit: 'cover' }}
          image={evento.imagen_url || '/placeholder_event_detail.jpg'} // Use a different placeholder for detail
          alt={evento.nombre}
        />
        <CardContent sx={{ flex: 1, p: 3 }}>
          <Typography component="h1" variant="h3" gutterBottom>
            {evento.nombre}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Fecha: {new Date(evento.fecha).toLocaleDateString()}
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Hora: {evento.hora ? evento.hora.substring(0, 5) : 'N/A'}
          </Typography>
          <Typography variant="body1" paragraph>
            {evento.descripcion}
          </Typography>
          {/* Add more sections based on your data structure if available */}
          {/* Example: */}
          {evento.duracion && (
            <Typography variant="body1" paragraph>
              Duración: {evento.duracion} minutos
            </Typography>
          )}
          {evento.edad_recomendada && (
            <Typography variant="body1" paragraph>
              Edad recomendada: {evento.edad_recomendada}
            </Typography>
          )}
          {evento.como_llegar && (
            <Typography variant="body1" paragraph>
              Cómo llegar: {evento.como_llegar}
            </Typography>
          )}
          {evento.elenco && (
            <Typography variant="body1" paragraph>
              Elenco: {evento.elenco}
            </Typography>
          )}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="h5" color="primary">
              Precio: ${evento.precio || 'Por determinar'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate(`/cola?eventoId=${evento.id}`)}
            >
              Comprar Entradas
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              onClick={() => navigate(`/foro/${evento.id}`)}
            >
              Ir al Foro
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Additional sections for text content, similar to the original image */}
      {/* You would populate these from your event data if available */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h4" gutterBottom>
          Acerca de este evento
        </Typography>
        <Typography variant="body1" paragraph>
          {/* Placeholder for more detailed description or specific sections from the image */}
          ¡Prepárate para reírte a carcajadas! {evento.nombre} te invita a cuestionar la realidad que nos rodea,
          planteando la sospecha de que todo podría ser parte de un gran complot.
        </Typography>
        <Typography variant="body1" paragraph>
          Con su afilado ingenio nos sumerge en un mundo donde las expectativas están sobrevaloradas y el humor es la
          mejor forma de enfrentar la confusión. No te pierdas esta oportunidad de disfrutar de una tarde llena de risas y
          reflexión con uno de los comediantes más destacados del momento.
        </Typography>
      </Box>
    </Container>
  );
}

export default EventDetail; 