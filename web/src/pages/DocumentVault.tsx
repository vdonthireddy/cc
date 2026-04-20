import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface Document {
  id: number;
  name: string;
  type: string;
  url: string;
  createdAt: string;
}

const DocumentVault: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: documents, isLoading, error } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await axios.get('/api/documents');
      return response.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setSnackbar({ open: true, message: 'File uploaded successfully!', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to upload file.', severity: 'error' });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.post(`/api/documents/share/${id}`);
      return response.data.shareLink;
    },
    onSuccess: (link) => {
      setShareLink(link);
      setIsShareModalOpen(true);
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to generate share link.', severity: 'error' });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDownload = (id: number) => {
    window.open(`/api/documents/download-direct/${id}`, '_blank');
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
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
          disabled={uploadMutation.isLoading}
        >
          {uploadMutation.isLoading ? 'Uploading...' : 'Upload Document'}
        </Button>
        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
      </Box>

      {error ? (
        <Typography color="error">Error loading documents.</Typography>
      ) : documents?.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', border: '2px dashed', borderColor: 'divider' }}>
          <Typography variant="h6" color="text.secondary">
            No documents found. Upload your first file to get started.
          </Typography>
        </Paper>
      ) : (
        <Card>
          <List sx={{ p: 0 }}>
            {Array.isArray(documents) ? documents.map((doc, index) => (
              <React.Fragment key={doc.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton onClick={() => handleDownload(doc.id)} color="primary" title="Download">
                        <DownloadIcon />
                      </IconButton>
                      <IconButton onClick={() => shareMutation.mutate(doc.id)} color="secondary" title="Share (24h)">
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
                    secondary={`${doc.type} • ${new Date(doc.createdAt).toLocaleDateString()}`} 
                  />
                </ListItem>
                {index < documents.length - 1 && <Divider />}
              </React.Fragment>
            )) : null}
          </List>
        </Card>

      )}

      {/* Share Link Modal */}
      <Dialog open={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Link Generated</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This link will expire in 24 hours.
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.default',
              wordBreak: 'break-all',
            }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1, mr: 1 }}>
              {shareLink}
            </Typography>
            <IconButton size="small" onClick={copyToClipboard}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsShareModalOpen(false)}>Close</Button>
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
