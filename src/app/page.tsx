'use client'

import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // You can add login logic here, like calling an API to authenticate
    console.log('Login:', { email, password })
  }
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        component="form"
        onSubmit={handleLogin}
        width="400px"
        spacing={3}
        p={4}
        border="1px solid gray"
        borderRadius={2}
        boxShadow={3}
      >
        <Typography variant="h4" textAlign="center">
          Login
        </Typography>

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          required
          sx={{
            input: { color: 'white' },
            label: { color: 'white' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'white',
              },
              '&:hover fieldset': {
                borderColor: 'white',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'white',
              },
            },
          }}
        />

        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          required
          sx={{
            input: { color: 'white' }, // Text color
            label: { color: 'white' }, // Label color
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'white', // Default border color
              },
              '&:hover fieldset': {
                borderColor: 'white', // Hovered border color
              },
              '&.Mui-focused fieldset': {
                borderColor: 'white', // Focused border color
              },
            },
          }}
        />

        <Button type="submit" variant="contained" fullWidth>
          Login
        </Button>
      </Stack>
    </Box>
  )
}
