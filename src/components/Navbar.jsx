import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  Badge,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'
import { useAuth } from '../context/AuthContext'

// Define navigation items based on auth status
const getPages = (isAuthenticated, isAdmin) => {
  const publicPages = [
    { name: 'Eventos', path: '/eventos' },
  ]

  const authenticatedPages = [
    ...publicPages,
    { name: 'Actores', path: '/actores' },
    { name: 'Boletos', path: '/boletos' },
    { name: 'Cola Virtual', path: '/cola' },
  ]

  const adminPages = [
    ...authenticatedPages,
    { name: 'Foro', path: '/foro' },
  ]

  if (isAdmin) return adminPages
  if (isAuthenticated) return authenticatedPages
  return publicPages
}

function Navbar() {
  const [anchorElNav, setAnchorElNav] = useState(null)
  const [anchorElUser, setAnchorElUser] = useState(null)
  const { user, logout, isAdmin, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  console.log('Auth State:', { user, isAdmin, isAuthenticated })

  const pages = getPages(isAuthenticated, isAdmin)
  console.log('Navigation Pages:', pages)

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget)
  }

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget)
  }

  const handleCloseNavMenu = () => {
    setAnchorElNav(null)
  }

  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  const handleLogout = async () => {
    await logout()
    handleCloseUserMenu()
    navigate('/iniciar-sesion')
  }

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Desktop Logo */}
          <TheaterComedyIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            TEATRO MORA
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.name}
                  onClick={handleCloseNavMenu}
                  component={RouterLink}
                  to={page.path}
                >
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <TheaterComedyIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            TEATRO MORA
          </Typography>

          {/* Desktop Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                component={RouterLink}
                to={page.path}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          {/* User Menu */}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            {isAuthenticated ? (
              <>
                <Typography
                  variant="subtitle1"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    color: 'inherit',
                  }}
                >
                  {user.nombre}
                  {isAdmin && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        ml: 1,
                        bgcolor: 'secondary.main',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      Admin
                    </Typography>
                  )}
                </Typography>
                <Tooltip title="Abrir configuración">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Badge
                      color="secondary"
                      variant="dot"
                      invisible={!isAdmin}
                    >
                      <Avatar alt={user.nombre}>
                        {user.nombre?.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem disabled>
                    <Typography textAlign="center">
                      {user.nombre}
                      {isAdmin && " (Admin)"}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <Typography textAlign="center">Cerrar Sesión</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={RouterLink}
                to="/iniciar-sesion"
                sx={{ color: 'white' }}
              >
                Iniciar Sesión
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Navbar 