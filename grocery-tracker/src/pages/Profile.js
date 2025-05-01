import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Fade,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

function Profile() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generate a random avatar URL based on username
  const getAvatarUrl = (username) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    setFormData(prev => ({
      ...prev,
      username: user.username,
    }));
  }, [navigate]);

  const handleSaveProfile = () => {
    try {
      if (!currentUser) return;

      // Update user data
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Check if username is already taken
      const isUsernameTaken = users.some(u => 
        u.id !== currentUser.id && u.username === formData.username
      );

      if (isUsernameTaken) {
        setError('Username is already taken');
        return;
      }

      // Update user data
      users[userIndex] = {
        ...users[userIndex],
        username: formData.username,
      };

      // Update current user
      const updatedUser = {
        ...currentUser,
        username: formData.username,
      };

      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setEditMode(false);
      setSuccess('Username updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error updating profile');
      console.error('Error updating profile:', error);
    }
  };

  const handleChangePassword = () => {
    try {
      if (!currentUser) return;

      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      if (users[userIndex].password !== formData.currentPassword) {
        setError('Current password is incorrect');
        return;
      }

      users[userIndex].password = formData.newPassword;
      localStorage.setItem('users', JSON.stringify(users));
      setOpenPasswordDialog(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setSuccess('Password updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error updating password');
      console.error('Error updating password:', error);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#e8f5e9',
      py: 4,
      backgroundImage: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    }}>
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={true} timeout={1000}>
          <Box sx={{ 
            mt: 4, 
            mb: 4,
            backgroundColor: 'white',
            borderRadius: 4,
            p: 4,
            boxShadow: '0 8px 32px rgba(46, 125, 50, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {/* Back Button */}
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{ 
                mb: 3,
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              Back to Dashboard
            </Button>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(211, 47, 47, 0.1)'
                }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.1)'
                }}
              >
                {success}
              </Alert>
            )}

            {/* Profile Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 4,
              gap: 3
            }}>
              <Avatar
                src={currentUser ? getAvatarUrl(currentUser.username) : ''}
                sx={{ 
                  width: 100, 
                  height: 100,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: `4px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}
              />
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  mb: 1
                }}>
                  {currentUser?.username}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {currentUser?.email}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Profile Settings */}
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Profile Settings
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Username
                  </Typography>
                  {!editMode && (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setEditMode(true)}
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        }
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </Box>

                {editMode ? (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          }
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(46, 125, 50, 0.3)',
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setEditMode(false);
                        setFormData(prev => ({ ...prev, username: currentUser.username }));
                      }}
                      sx={{ 
                        color: theme.palette.error.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body1" color="textSecondary">
                    {currentUser?.username}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                  Password
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setOpenPasswordDialog(true)}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  Change Password
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Container>

      {/* Password Change Dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(46, 125, 50, 0.15)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          pb: 2,
          fontWeight: 600,
          color: theme.palette.primary.main
        }}>
          Change Password
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenPasswordDialog(false)}
            sx={{ 
              borderRadius: 2,
              px: 3,
              '&:hover': {
                backgroundColor: alpha(theme.palette.grey[500], 0.1),
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleChangePassword}
            sx={{ 
              borderRadius: 2,
              px: 3,
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(46, 125, 50, 0.3)',
              }
            }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Profile; 