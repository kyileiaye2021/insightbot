import axios from 'axios';
import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! How can I help you today?`,
    },
  ]);
  const [message, setMessage] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setUploadMessage('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadMessage(response.data.message);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadMessage('Error uploading file');
    }
  };

  // Handle sending message to chatbot
  const sendMessage = async () => {
    setMessage('');
    setMessages((messages) => [...messages, { role: 'user', content: message }, { role: 'assistant', content: '' }]);

    try {
      const response = await axios.post('http://127.0.0.1:5000/chat', { question: message });
      const assistantReply = response.data.answer;
      setMessages((messages) => [...messages, { role: 'assistant', content: assistantReply }]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <h1>AI Chatbot</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload File</button>
      <p>{uploadMessage}</p>
      <div>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask a question" />
        <button onClick={sendMessage}>Send Message</button>
      </div>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.role}:</strong> {msg.content}
          </p>
        ))}
      </div>
    </div>
  );
}
