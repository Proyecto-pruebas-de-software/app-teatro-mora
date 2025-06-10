import { Link as RouterLink } from 'react-router-dom'
import { Container, Typography, Grid, Card, CardContent, Button, Box, Skeleton, CardActions } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

function Inicio() {
  const { data: eventos, isLoading } = useQuery({
    queryKey: ['eventos-destacados'],
    queryFn: async () => {
      const response = await axios.get('/api/eventos')
      const eventosData = response.data.data || response.data || []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return eventosData
        .filter(evento => new Date(evento.fecha) >= today)
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 3)
    }
  })

  const LoadingEventCard = () => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={36} sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  )

  return (
    <Box>
      {/* Sección Principal */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
          borderRadius: { xs: 0, sm: 2 },
          mx: { xs: -3, sm: 0 },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Bienvenido al Teatro Mora
          </Typography>
          <Typography variant="h5" align="center" paragraph>
            Disfruta de la magia del teatro en el corazón de la ciudad
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            {/* <Button
              component={RouterLink}
              to="/eventos"
              variant="contained"
              color="secondary"
              size="large"
            >
              Ver Eventos
            </Button> */}
            <Button
              component={RouterLink}
              to="/boletos"
              variant="outlined"
              color="inherit"
              size="large"
            >
              Comprar Boletos
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Eventos Destacados */}
      <Container maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          gutterBottom
          sx={{ mb: 4 }}
        >
          Próximos Espectáculos
        </Typography>
        <Grid container spacing={4}>
          {isLoading ? (
            // Esqueleto de carga
            [...Array(3)].map((_, index) => (
              <Grid item key={`skeleton-${index}`} xs={12} sm={6} md={4}>
                <LoadingEventCard />
              </Grid>
            ))
          ) : eventos && eventos.length > 0 ? (
            // Eventos reales
            eventos.map((evento) => (
              <Grid item key={evento.id} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: '0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h3">
                      {evento.nombre}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                      {new Date(evento.fecha).toLocaleDateString()} - {evento.hora || 'Hora por confirmar'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {evento.descripcion?.length > 100 
                        ? `${evento.descripcion.substring(0, 100)}...` 
                        : evento.descripcion}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ mt: 'auto' }}>
                    <Button
                      component={RouterLink}
                      to={`/eventos/${evento.id}`}
                      variant="contained"
                      size="small"
                    >
                      Más Información
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            // No se encontraron eventos
            <Grid item xs={12}>
              <Typography variant="h6" align="center" color="text.secondary">
                No hay próximos eventos programados
              </Typography>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  )
}

export default Inicio 