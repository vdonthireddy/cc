import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
} from '@mui/material';
import { Send as SendIcon, School as SchoolIcon, Person as PersonIcon } from '@mui/icons-material';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

const InterviewPrep: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I am an admissions officer from Harvard. Are you ready for your mock interview?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setIsLoading(true);

    try {
      // Pre-prompt context for the mock interview
      const prePrompt = "Context: You are an admissions officer at Harvard. Conduct a mock interview for me. User says: ";
      const response = await axios.post('/api/chat', { prompt: prePrompt + userMessage });
      
      setMessages(prev => [...prev, { text: response.data.response, sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "Error: Could not connect to the admissions officer.", sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Harvard Mock Interview
      </Typography>
      
      <Paper sx={{ flexGrow: 1, mb: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box 
          ref={scrollRef}
          sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {messages?.map((msg, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              <Avatar sx={{ bgcolor: msg.sender === 'user' ? 'secondary.main' : 'primary.main' }}>
                {msg.sender === 'user' ? <PersonIcon /> : <SchoolIcon />}
              </Avatar>
              <Paper 
                sx={{ 
                  p: 1.5, 
                  maxWidth: '70%', 
                  borderRadius: 2,
                  bgcolor: msg.sender === 'user' ? 'secondary.light' : 'grey.100',
                  color: 'black'
                }}
              >
                <Typography variant="body1">{msg.text}</Typography>
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Typography variant="caption" sx={{ ml: 6 }}>Admissions officer is typing...</Typography>
          )}
        </Box>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Type your response..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <IconButton color="primary" onClick={handleSend} disabled={isLoading}>
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default InterviewPrep;
