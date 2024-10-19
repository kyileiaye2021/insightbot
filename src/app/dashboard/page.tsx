'use client'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
    },
  ])
  const [message, setMessage] = useState('')

  const sendMessage = async () => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''},
    ])
  
    const response = fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, {role: 'user', content: message}]),
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
  
      return reader.read().then(function processText({done, value}) {
        if (done) {
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text},
          ]
        })
        return reader.read().then(processText)
      })
    })
  }

  /*const addTodo = () => {
    if (todo.trim()) {
      setTodos([...todos, todo])
      setTodo('')
    }
  }*/

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
      {/* Top Button */}
      <Button variant="contained" sx={{ mb: 3 }}>
        Upload Files
      </Button>

      {/* Columns Layout */}
      <Stack direction="row" spacing={4} width="100%" height="80%">
        {/* Left Column: Chatbot */}
        <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
          <Button variant="contained" onClick={sendMessage}>
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>

        {/* Right Column: Todo List */}
        <Box
          width="50%"
          height="100%"
          border="1px solid gray"
          borderRadius={2}
          p={2}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Typography variant="h6" mb={2}>
            Todo List
          </Typography>
          <Stack direction="column" spacing={2} flexGrow={1} overflow="auto">
            {/*{todos.map((todoItem, index) => (
              <Box
                key={index}
                bgcolor="secondary.main"
                color="white"
                p={2}
                borderRadius={16}
              >
                {todoItem}
              </Box>
            ))}*/}
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}
