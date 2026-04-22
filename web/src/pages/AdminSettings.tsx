import React from 'react';
import { 
  Box, Paper, Typography, Tabs, Tab, Button, Switch, FormControlLabel, 
  Divider, CircularProgress, Alert, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Tooltip, Select, InputLabel, FormControl, OutlinedInput
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyIcon from '@mui/icons-material/Key';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNavigate } from 'react-router-dom';

const AdminSettings: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [openAddDialog, setOpenAddDialog] = React.useState(false);
  const [openAssignDialog, setOpenAssignDialog] = React.useState(false);
  const [openAddCounselorDialog, setOpenAddCounselorDialog] = React.useState(false);
  const [openAddParentDialog, setOpenAddParentDialog] = React.useState(false);
  const [openResetDialog, setOpenResetDialog] = React.useState(false);
  
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null);
  const [selectedCounselor, setSelectedCounselor] = React.useState<any>(null);

  const [formData, setFormData] = React.useState({
    email: '', name: '', grade: 9, zipCode: '', majorInterest: '', counselorId: '', parentId: ''
  });
  const [counselorFormData, setCounselorFormData] = React.useState({
    email: '', name: '', password: ''
  });
  const [parentFormData, setParentFormData] = React.useState({
    email: '', name: '', password: '', studentIds: [] as number[]
  });
  const [resetPasswordData, setResetPasswordData] = React.useState({
    newPassword: ''
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Queries
  const { data: config, isLoading: configLoading, error: configError } = useQuery(['adminConfig'], async () => {
    const res = await axios.get('/api/admin/config/');
    return res.data;
  });

  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery(['adminStudents'], async () => {
    const res = await axios.get('/api/counselor/students/');
    return res.data;
  });

  const { data: allCounselors } = useQuery(['adminCounselorsAll'], async () => {
    const res = await axios.get('/api/admin/counselors/');
    return res.data;
  });

  const { data: activeCounselors } = useQuery(['adminCounselorsActive'], async () => {
    const res = await axios.get('/api/admin/counselors?active_only=true');
    return res.data;
  });

  const { data: parents } = useQuery(['adminParents'], async () => {
    const res = await axios.get('/api/admin/parents/');
    return res.data;
  });

  // Mutations
  const configMutation = useMutation(
    async (newConfig: any) => {
      const res = await axios.patch('/api/admin/config/', newConfig);
      return res.data;
    },
    { onSuccess: () => queryClient.invalidateQueries(['adminConfig']) }
  );

  const saveStudentMutation = useMutation(
    async (studentData: any) => {
      if (selectedStudent) {
        const res = await axios.patch(`/api/admin/students/${selectedStudent.id}/`, studentData);
        return res.data;
      } else {
        const res = await axios.post('/api/admin/students/', studentData);
        return res.data;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminStudents']);
        setOpenAddDialog(false);
        setSelectedStudent(null);
        setFormData({ email: '', name: '', grade: 9, zipCode: '', majorInterest: '', counselorId: '', parentId: '' });
      },
    }
  );

  const assignCounselorMutation = useMutation(
    async ({ studentId, counselorId, parentId }: any) => {
      const res = await axios.patch(`/api/admin/students/${studentId}/`, { counselorId, parentId });
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminStudents']);
        setOpenAssignDialog(false);
      },
    }
  );

  const addCounselorMutation = useMutation(
    async (newCounselor: any) => {
      const res = await axios.post('/api/admin/counselors/', newCounselor);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminCounselorsAll']);
        queryClient.invalidateQueries(['adminCounselorsActive']);
        setOpenAddCounselorDialog(false);
        setCounselorFormData({ email: '', name: '', password: '' });
      },
    }
  );

  const addParentMutation = useMutation(
    async (newParent: any) => {
      const res = await axios.post('/api/admin/parents/', newParent);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminParents']);
        setOpenAddParentDialog(false);
        setParentFormData({ email: '', name: '', password: '', studentIds: [] });
      },
    }
  );

  const resetPasswordMutation = useMutation(
    async ({ id, newPassword }: any) => {
      const res = await axios.patch(`/api/admin/counselors/${id}/reset-password/`, { newPassword });
      return res.data;
    },
    {
      onSuccess: () => {
        setOpenResetDialog(false);
        setResetPasswordData({ newPassword: '' });
        alert('Password reset successfully');
      },
    }
  );

  const toggleCounselorMutation = useMutation(
    async (id: number) => {
      const res = await axios.patch(`/api/admin/counselors/${id}/toggle-active/`);
      return res.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminCounselorsAll']);
        queryClient.invalidateQueries(['adminCounselorsActive']);
        queryClient.invalidateQueries(['adminStudents']);
      },
    }
  );

  const toggleParentMutation = useMutation(
    async (id: number) => {
      const res = await axios.patch(`/api/admin/parents/${id}/toggle-active/`);
      return res.data;
    },
    {
      onSuccess: () => queryClient.invalidateQueries(['adminParents'])
    }
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStudentSelect = (event: any) => {
    const { value } = event.target;
    setParentFormData({
      ...parentFormData,
      studentIds: typeof value === 'string' ? value.split(',').map(Number) : value,
    });
  };

  if (configLoading || studentsLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
      <CircularProgress />
    </Box>
  );

  if (configError || studentsError) {
    return (
      <Box p={3}><Alert severity="error">Failed to load admin data.</Alert></Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Admin Control Panel
      </Typography>
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Students" />
          <Tab label="Counselors" />
          <Tab label="Parents" />
          <Tab label="Agent Controls" />
          <Tab label="Feature Flags" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Students Tab */}
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Manage Students</Typography>
                <Button variant="contained" onClick={() => { setSelectedStudent(null); setOpenAddDialog(true); }}>Add Student</Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white' }}>Name</TableCell>
                      <TableCell sx={{ color: 'white' }}>Grade</TableCell>
                      <TableCell sx={{ color: 'white' }}>Counselor</TableCell>
                      <TableCell sx={{ color: 'white' }}>GPA</TableCell>
                      <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(students) && students.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {student.counselorName}
                            <IconButton size="small" onClick={() => {
                              setSelectedStudent(student);
                              setFormData({ ...formData, counselorId: student.counselorId || '', parentId: student.parentId || '' });
                              setOpenAssignDialog(true);
                            }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>{student.gpa}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => { navigate(`/roadmap?studentId=${student.id}`); }}>Roadmap</Button>
                            <Button size="small" variant="outlined" color="secondary" startIcon={<EditIcon />} onClick={() => {
                              setSelectedStudent(student);
                              setFormData({
                                email: student.email, name: student.name, grade: student.grade,
                                zipCode: student.zipCode || '', majorInterest: student.majorInterest || '',
                                counselorId: student.counselorId || '',
                                parentId: student.parentId || ''
                              });
                              setOpenAddDialog(true);
                            }}>Edit</Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Counselors Tab */}
          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Manage Counselors</Typography>
                <Button variant="contained" onClick={() => setOpenAddCounselorDialog(true)}>Add Counselor</Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'secondary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white' }}>Name</TableCell>
                      <TableCell sx={{ color: 'white' }}>Email</TableCell>
                      <TableCell sx={{ color: 'white' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(allCounselors) && allCounselors.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={c.isActive ? "Active" : "Inactive"} 
                            color={c.isActive ? "success" : "default"}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                                size="small" 
                                variant="outlined" 
                                color={c.isActive ? "error" : "success"}
                                startIcon={c.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                                onClick={() => toggleCounselorMutation.mutate(c.id)}
                            >
                                {c.isActive ? "Inactivate" : "Activate"}
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                startIcon={<KeyIcon />}
                                onClick={() => {
                                    setSelectedCounselor(c);
                                    setOpenResetDialog(true);
                                }}
                            >
                                Reset Pass
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Parents Tab */}
          {tabValue === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Manage Parents</Typography>
                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setOpenAddParentDialog(true)}>Add Parent</Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'info.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white' }}>Name</TableCell>
                      <TableCell sx={{ color: 'white' }}>Email</TableCell>
                      <TableCell sx={{ color: 'white' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(parents) && parents.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={p.isActive ? "Active" : "Inactive"} 
                            color={p.isActive ? "success" : "default"}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color={p.isActive ? "error" : "success"}
                            startIcon={p.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                            onClick={() => toggleParentMutation.mutate(p.id)}
                          >
                            {p.isActive ? "Inactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Agent Controls Tab */}
          {tabValue === 3 && (
             <Box>
                <Typography variant="h6" gutterBottom>Agent Controls</Typography>
                <FormControlLabel
                  control={<Switch checked={config?.agentConfig?.scout?.enabled || false} onChange={() => {
                    const newConfig = { ...config.agentConfig };
                    newConfig.scout.enabled = !newConfig.scout.enabled;
                    configMutation.mutate({ agentConfig: newConfig });
                  }} />}
                  label="Enable Opportunity Scout"
                />
             </Box>
          )}

          {/* Feature Flags Tab */}
          {tabValue === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>Feature Flags</Typography>
              <FormControlLabel
                control={<Switch checked={config?.featureFlags?.scholarships || false} onChange={() => {
                  const newFlags = { ...config.featureFlags };
                  newFlags.scholarships = !newFlags.scholarships;
                  configMutation.mutate({ featureFlags: newFlags });
                }} />}
                label="Enable Scholarships Module"
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Dialogs */}
      <Dialog open={openAddDialog} onClose={() => { setOpenAddDialog(false); setSelectedStudent(null); }}>
        <DialogTitle>{selectedStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        <DialogContent>
          <TextField id="s-name" fullWidth label="Name" margin="normal" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          {!selectedStudent && <TextField id="s-email" fullWidth label="Email" margin="normal" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />}
          <TextField id="s-grade" fullWidth select label="Grade" margin="normal" value={formData.grade} onChange={(e) => setFormData({...formData, grade: Number(e.target.value)})}>
            {[9,10,11,12].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
          </TextField>
          <TextField id="s-zip" fullWidth label="Zip Code" margin="normal" value={formData.zipCode} onChange={(e) => setFormData({...formData, zipCode: e.target.value})} />
          <TextField id="s-counselor" fullWidth select label="Counselor (Optional)" margin="normal" value={formData.counselorId} onChange={(e) => setFormData({...formData, counselorId: e.target.value})}>
            <MenuItem value="">None</MenuItem>
            {Array.isArray(activeCounselors) && activeCounselors.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField id="s-parent" fullWidth select label="Parent (Optional)" margin="normal" value={formData.parentId} onChange={(e) => setFormData({...formData, parentId: e.target.value})}>
            <MenuItem value="">None</MenuItem>
            {Array.isArray(parents) && parents.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenAddDialog(false); setSelectedStudent(null); }}>Cancel</Button>
          <Button variant="contained" onClick={() => saveStudentMutation.mutate(formData)}>{selectedStudent ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
        <DialogTitle>Assign Roles for {selectedStudent?.name}</DialogTitle>
        <DialogContent>
          <TextField id="as-counselor" fullWidth select label="Counselor" margin="normal" value={formData.counselorId} onChange={(e) => setFormData({...formData, counselorId: e.target.value})}>
            <MenuItem value="">None</MenuItem>
            {Array.isArray(activeCounselors) && activeCounselors.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField id="as-parent" fullWidth select label="Parent" margin="normal" value={formData.parentId} onChange={(e) => setFormData({...formData, parentId: e.target.value})}>
            <MenuItem value="">None</MenuItem>
            {Array.isArray(parents) && parents.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => assignCounselorMutation.mutate({ studentId: selectedStudent?.id, counselorId: formData.counselorId, parentId: formData.parentId })}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAddCounselorDialog} onClose={() => setOpenAddCounselorDialog(false)}>
        <DialogTitle>Add New Counselor</DialogTitle>
        <DialogContent>
          <TextField id="c-name" fullWidth label="Name" margin="normal" value={counselorFormData.name} onChange={(e) => setCounselorFormData({...counselorFormData, name: e.target.value})} />
          <TextField id="c-email" fullWidth label="Email" margin="normal" value={counselorFormData.email} onChange={(e) => setCounselorFormData({...counselorFormData, email: e.target.value})} />
          <TextField id="c-password" fullWidth label="Password" type="password" margin="normal" value={counselorFormData.password} onChange={(e) => setCounselorFormData({...counselorFormData, password: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddCounselorDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => addCounselorMutation.mutate(counselorFormData)}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAddParentDialog} onClose={() => setOpenAddParentDialog(false)}>
        <DialogTitle>Add New Parent</DialogTitle>
        <DialogContent>
          <TextField id="p-name" fullWidth label="Name" margin="normal" value={parentFormData.name} onChange={(e) => setParentFormData({...parentFormData, name: e.target.value})} />
          <TextField id="p-email" fullWidth label="Email" margin="normal" value={parentFormData.email} onChange={(e) => setParentFormData({...parentFormData, email: e.target.value})} />
          <TextField id="p-password" fullWidth label="Password" type="password" margin="normal" value={parentFormData.password} onChange={(e) => setParentFormData({...parentFormData, password: e.target.value})} />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="p-students-label">Associated Students</InputLabel>
            <Select
              labelId="p-students-label"
              id="p-students"
              multiple
              value={parentFormData.studentIds}
              onChange={handleStudentSelect}
              input={<OutlinedInput label="Associated Students" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const student = students.find((s: any) => s.id === value);
                    return <Chip key={value} label={student?.name || value} size="small" />;
                  })}
                </Box>
              )}
            >
              {Array.isArray(students) && students.map((s: any) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddParentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => addParentMutation.mutate(parentFormData)}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>Reset Password: {selectedCounselor?.name}</DialogTitle>
        <DialogContent>
          <TextField id="rp-password" fullWidth label="New Password" type="password" margin="normal" value={resetPasswordData.newPassword} onChange={(e) => setResetPasswordData({...resetPasswordData, newPassword: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => resetPasswordMutation.mutate({ id: selectedCounselor?.id, newPassword: resetPasswordData.newPassword })}>Reset</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSettings;
