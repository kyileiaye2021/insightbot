'use client'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import axios from 'axios'

export default function Home() {
  const [file, setFile] = useState(null) // State to store selected file
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:' Hi! How can I help you today?',
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
      setUploadMessage('Error uploading file')  // Show error message
    }
  }

  const sendMessage = async () => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''},
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
      <Button variant="contained" sx={{ mb: 3 }} onClick={handleUpload}>
        Upload Files
      </Button>
      <Typography>{uploadMessage}</Typography> {/* Display upload status */}

      <input type="file" onChange={handleFileChange} name='file'/> {/**allow users to select the PDF file for uploading */}

      {/* Columns Layout */}
      <Stack direction="row" spacing={4} width="100%" height="80%">
        {/* Chatbot UI */}
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