'use client'
import { Box, Button, Stack, TextField, Typography, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, AppBar, Toolbar } from '@mui/material'
import { useState } from 'react'
import axios from 'axios'
import SendIcon from '@mui/icons-material/Send'
import AddIcon from '@mui/icons-material/Add'

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
  const [goals, setGoals] = useState([])
  const [newGoal, setNewGoal] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState('')
  const [goalAdvice, setGoalAdvice] = useState('')
  const [generatedTasks, setGeneratedTasks] = useState('')
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')

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

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()])
      setNewGoal('')
    }
  }

  const getGoalAdvice = async (goal) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/goaladvise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal: goal }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setGoalAdvice(data.advice)
      setOpenDialog(true)
    } catch (error) {
      console.error('Error:', error)
      setGoalAdvice('An error occurred while fetching goal advice.')
      setOpenDialog(true)
    }
  }

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { text: newTodo.trim(), done: false }])
      setNewTodo('')
    }
  }

  const toggleTodo = (index) => {
    const newTodos = [...todos]
    newTodos[index].done = !newTodos[index].done
    setTodos(newTodos)
  }

  const createTasksGoal = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/generatetodotask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal: selectedGoal }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.generated.tasks && Array.isArray(data.generated.tasks)) {
        for (let i = 0; i < data.generated.tasks.length; i++) {
            setTodos((prevTodos) => [...prevTodos, { text: data.generated.tasks[i], done: false }])
        }
        setOpenDialog(false)
      } else {
        console.log(data.generated);
      }
    } catch (error) {
      console.error('Error:', error)
      setGeneratedTasks('An error occurred while creating tasks.')
      setOpenDialog(false)
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
    >
      <AppBar position="static" sx={{ bgcolor: '#004d80' }}>
        <Toolbar>
          <Typography variant="h4" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            INSIGHTBOT - AI Student Assistant
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Upload Button */}
      <Stack width="100vw" p={2} alignItems="center" style={{
        backgroundColor: '#004d80',
      }}>
        <Typography><b>Select a PDF file to add to the database</b></Typography>
        <Stack direction="row" spacing={1}>
          <input type="file" accept=".pdf" onChange={handleFileChange} name='file' style={{ border: '2px dashed #0099ff', borderRadius: '5px', padding: '5px' }} />
          <Button variant="contained" onClick={handleUpload}>Upload</Button>
        </Stack>
        <Typography style={{ color: '#99d6ff' }}><b>{uploadMessage}</b></Typography>
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
          <Typography style={{ color: '#0099ff', fontSize: '1.5rem' }}><b>Chat with your notes!</b></Typography>
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
            justifyContent="flex-start"
            alignItems="center"
            style={{ border: '4px solid #cc5200', borderRadius: '5px', backgroundColor: 'rgba(204, 82, 0, 0.3)' }}
          >
            <Typography style={{ color: '#ff6600', fontSize: '1.5rem' }}><b>Your goals</b></Typography>
            <Stack direction="row" spacing={2} width="90%" mt={2}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter a new goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
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
              <IconButton onClick={addGoal} sx={{ color: 'white' }}>
                <AddIcon />
              </IconButton>
            </Stack>
            <Stack direction="column" spacing={1} width="90%" mt={2} overflow="auto">
              {goals.map((goal, index) => (
                <Button
                  key={index}
                  fullWidth
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start', color: 'white', borderColor: 'white' }}
                  onClick={() => {
                    setSelectedGoal(goal)
                    getGoalAdvice(goal)
                  }}
                >
                  {goal}
                </Button>
              ))}
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
            <Stack direction="row" spacing={2} width="90%" mt={2}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter a new todo..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
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
              <IconButton onClick={addTodo} sx={{ color: 'white' }}>
                <AddIcon />
              </IconButton>
            </Stack>
            <Stack direction="column" spacing={1} width="90%" mt={2} overflow="auto">
              {todos.map((todo, index) => (
                <Button
                  key={index}
                  fullWidth
                  variant="outlined"
                  sx={{
                    justifyContent: 'flex-start',
                    color: 'white',
                    borderColor: 'white',
                    textDecoration: todo.done ? 'line-through' : 'none'
                  }}
                  onClick={() => toggleTodo(index)}
                  startIcon={<Checkbox checked={todo.done} sx={{ color: 'white' }} />}
                >
                  {todo.text}
                </Button>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Stack>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle><b>Goal Advice:</b> {selectedGoal}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {goalAdvice}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={createTasksGoal}>Generate tasks</Button>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
