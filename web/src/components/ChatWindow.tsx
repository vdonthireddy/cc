import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box,
  Fab,
  Drawer,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as RobotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const ChatWindow: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [history, setHistory] = useState<Message[]>([
    { text: "Hi there! I'm your Pathfinder assistant. How can I help you with your academic planning today?", sender: 'bot' },
  ]);

  const chatMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await axios.post('/api/chat', { prompt: text });
      return response.data.response;
    },
    onSuccess: (botResponse) => {
      setHistory((prev) => [...prev, { text: botResponse, sender: 'bot' }]);
    },
    onError: () => {
      setHistory((prev) => [...prev, { text: "Sorry, I'm having trouble connecting right now. Please try again later.", sender: 'bot' }]);
    },
  });

  const handleSend = () => {
    if (!prompt.trim()) return;

    const userMessage = prompt;
    setHistory((prev) => [...prev, { text: userMessage, sender: 'user' }]);
    setPrompt('');
    chatMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        onClick={() => setIsOpen(true)}
      >
        <ChatIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RobotIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Pathfinder AI</Typography>
          </Box>
          <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Chat History */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}>
          <List disablePadding>
            {history?.map((msg, index) => (
              <ListItem
                key={index}
                sx={{
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                  px: 0,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {msg.sender === 'bot' && <RobotIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />}
                  <Typography variant="caption" color="text.secondary">
                    {msg.sender === 'user' ? 'You' : 'Pathfinder AI'}
                  </Typography>
                  {msg.sender === 'user' && <PersonIcon fontSize="small" sx={{ ml: 0.5, color: 'secondary.main' }} />}
                </Box>
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '85%',
                    borderRadius: 2,
                    bgcolor: msg.sender === 'user' ? 'primary.main' : 'white',
                    color: msg.sender === 'user' ? 'white' : 'text.primary',
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                </Paper>
              </ListItem>
            ))}
            {chatMutation.isLoading && (
              <ListItem sx={{ px: 0 }}>
                <CircularProgress size={20} />
              </ListItem>
            )}
          </List>
        </Box>

        <Divider />

        {/* Input */}
        <Box sx={{ p: 2, bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask me anything..."
              variant="outlined"
              size="small"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={chatMutation.isLoading}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!prompt.trim() || chatMutation.isLoading}
              sx={{ ml: 1 }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default ChatWindow;
