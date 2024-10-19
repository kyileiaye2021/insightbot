'use client'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import axios from 'axios'

export default function Home() {
  const [file, setFile] = useState(null) // State to store selected file
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: ' Hi! How can I help you today?',
    },
  ])
  const [message, setMessage] = useState('')
  const [uploadMessage, setUploadMessage] = useState('') // State for showing upload status

  // Functioin to handle file selection
  //This function is triggered when a user selects a file
  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  //function to handle file upload
  //This function is triggered when the user clicks the Upload Files button. 
  const handleUpload = async () => {
    if (!file) {
      setUploadMessage('Please select a file to upload')
      return
    }
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData)  // URL to your Flask backend
      setUploadMessage(response.data.message)  // Show success message
    } catch (error) {
      setUploadMessage('Error uploading file, try again')  // Show error message
    }
  }

  const sendMessage = async () => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])

    const response = fetch('http://127.0.0.1:5000/chat', { //// Point to Flask backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: message }), // send only the user message
    }).then(async (res) => {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let result = ''

      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result
        }

        const text = decoder.decode(value || new Uint8Array(), { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
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
      {/* Upload Button */}
      <Stack width="100vw" p={2} alignItems="center" style={{
        backgroundColor: '#004d80',
      }}>
        <Typography><b>Select a PDF file to add to the database</b></Typography>
        <Stack direction="row" spacing={1}>
          <input type="file" accept=".pdf" onChange={handleFileChange} name='file' style={{ border: '2px dashed #0099ff', borderRadius: '5px', padding: '5px' }} />
          <Button variant="contained" onClick={handleUpload}>Upload</Button>
        </Stack>
        <Typography style={{ color: '#ff3333' }}><b>{uploadMessage}</b></Typography>
      </Stack>

      {/* Columns Layout */}
      <Stack direction="row" spacing={2} width="100vw" p={2} alignItems="center">
        <Box
          width="40vw"
          height="90vh"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          style={{ border: '4px solid #004d80', borderRadius: '5px', backgroundColor: 'rgba(0, 77, 128, 0.3)' }}
        >
          <Typography style={{ color: '#0099ff', fontSize: '1.5rem' }}><b>Chat with your database</b></Typography>
          <Stack
            direction="column"
            width="100%"
            height="100%"
            p={2}
            spacing={3}
          >
            <Stack
              direction="column"
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
                        ? '#004d80'
                        : '#595959'
                    }
                    p={1.2}
                    style={{ borderRadius: '5px', color: 'white' }}
                  >
                    {message.content}
                  </Box>
                </Box>
              ))}
            </Stack>
            <Stack direction="row" spacing={2} width="100%" overflow="auto">
              <TextField
                label="Write your message..."
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

        <Stack direction="column" spacing={2} width="60vw" p={2} alignItems="center">

          <Box
            width="100%"
            height="44vh"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            style={{ border: '4px solid #cc5200', borderRadius: '5px', backgroundColor: 'rgba(204, 82, 0, 0.3)' }}
          >
            <Typography style={{ color: '#ff6600', fontSize: '1.5rem' }}><b>Your goals</b></Typography>
            <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" alignItems="left" justifyContent="left">
              <Typography style={{ color: 'white' }}>Goal 1</Typography>
              <Typography style={{ color: 'white' }}>Goal 2</Typography>
              <Typography style={{ color: 'white' }}>Goal 3</Typography>
              <Typography style={{ color: 'white' }}>Goal 4</Typography>
              <Typography style={{ color: 'white' }}>Goal 5</Typography>
            </Stack>
          </Box>

          <Box
            width="100%"
            height="44vh"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            style={{ border: '4px solid #7a0099', borderRadius: '5px', backgroundColor: 'rgba(122, 0, 153, 0.3)' }}
          >
            <Typography style={{ color: '#b800e6', fontSize: '1.5rem' }}><b>To-do List</b></Typography>
            <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" alignItems="left" justifyContent="left">
              <Typography style={{ color: 'white' }}>Task 1</Typography>
              <Typography style={{ color: 'white' }}>Task 2</Typography>
              <Typography style={{ color: 'white' }}>Task 3</Typography>
              <Typography style={{ color: 'white' }}>Task 4</Typography>
              <Typography style={{ color: 'white' }}>Task 5</Typography>
            </Stack>
          </Box>

        </Stack>
      </Stack>
    </Box >
  )
}