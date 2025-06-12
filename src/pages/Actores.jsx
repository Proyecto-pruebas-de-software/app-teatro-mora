import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
} from '@mui/material'
import axios from 'axios'

function Actores() {
  const [terminoBusqueda, setTerminoBusqueda] = useState('')

  const { data: actores, isLoading, error } = useQuery({
    queryKey: ['actores'],
    queryFn: async () => {
      const response = await axios.get('/api/actores')
      return response.data.data
    }
  })

  const actoresFiltrados = actores?.filter(actor =>
    actor.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
    (actor.biografia_resumen && actor.biografia_resumen.toLowerCase().includes(terminoBusqueda.toLowerCase()))
  )

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
        Error al cargar los actores. Por favor, intente nuevamente más tarde.
      </Alert>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Actores del Teatro
      </Typography>

      <TextField
        fullWidth
        label="Buscar Actores"
        variant="outlined"
        value={terminoBusqueda}
        onChange={(e) => setTerminoBusqueda(e.target.value)}
        sx={{ mb: 4 }}
      />

      <Grid container spacing={4}>
        {actoresFiltrados?.map((actor) => (
          <Grid item key={actor.id} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="500"
                image={`https://placekeanu.com/400/500?random=${actor.id}`}
                alt={actor.nombre}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {actor.nombre}
                </Typography>
                <Typography paragraph>
                  {actor.biografia_resumen || actor.biografia || 'Sin biografía'}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Ver Perfil
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default Actores 