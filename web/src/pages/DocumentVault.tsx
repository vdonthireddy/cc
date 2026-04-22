import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  FolderCopy as FolderIcon,
  Description as FileIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

const DocumentVault: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await axios.get('/api/documents/');
      return res.data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSnackbar({ open: true, message: 'File uploaded successfully!', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to upload file.', severity: 'error' });
    }
  });

  const shareMutation = useMutation({
    mutationFn: async (docId: number) => {
      const res = await axios.post(`/api/documents/share/${docId}`);
      return res.data.shareLink;
    },
    onSuccess: (link) => {
      setShareLink(link);
      setShareDialogOpen(true);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to generate share link.', severity: 'error' });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDownload = (docId: number) => {
    window.open(`/api/documents/download-direct/${docId}`, '_blank');
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
    }
  };

  return (
    <Box p={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
            <FolderIcon fontSize="large" />
            Document Vault
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Securely store and share your academic records.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<UploadIcon />} 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
        </Button>
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
        />
      </Box>

      {error ? (
        <Alert severity="error">Error loading documents.</Alert>
      ) : isLoading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : documents?.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', border: '2px dashed', borderColor: 'divider' }}>
          <Typography variant="h6" color="text.secondary">
            No documents found. Upload your first file to get started.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 2, boxShadow: 3 }}>
          <List sx={{ p: 0 }}>
            {Array.isArray(documents) && documents.map((doc: any, index: number) => (
              <React.Fragment key={doc.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" aria-label="download" onClick={() => handleDownload(doc.id)} color="primary" sx={{ mr: 1 }}>
                        <DownloadIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="share" onClick={() => shareMutation.mutate(doc.id)} color="secondary">
                        <ShareIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    <FileIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={doc.name} 
                    secondary={`${doc.type} • Uploaded on ${new Date(doc.createdAt).toLocaleDateString()}`} 
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                </ListItem>
                {index < documents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Link Generated</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This link will expire in 24 hours.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default', wordBreak: 'break-all' }}>
            <Typography variant="body2" sx={{ flexGrow: 1, mr: 1 }}>
              {shareLink}
            </Typography>
            <IconButton size="small" onClick={copyToClipboard}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentVault;
