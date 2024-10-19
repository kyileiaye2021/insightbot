'use client'

import { Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'

export default function Home() {
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      p={2}
    >
      <Stack
        width="50vw"
        spacing={0}
        p={4}
        style={{ border: '4px solid #004d80', borderRadius: '5px', backgroundColor: 'rgba(0, 77, 128, 0.3)' }}
        alignItems="center"
      >
        <Typography style={{ color: '#bfbfbf', fontSize: '2rem', textAlign: 'center' }}><b>Welcome to</b></Typography>
        <Typography style={{ color: '#0099ff', fontSize: '4rem', textAlign: 'center' }}><b>InsightBot</b></Typography>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          onClick={() => window.location.href = '/dashboard'}
        >Go to dashboard</Button>
      </Stack>
    </Box>
  )
}
