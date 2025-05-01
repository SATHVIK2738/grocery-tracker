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
  Avatar,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { logoutUser, updateProfile, updatePassword } from '../services/apiService';

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
  const [isLoading, setIsLoading] = useState(false);

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await updateProfile(currentUser.id, {
        username: formData.username,
      });
      
      // Update local storage with new user data
      const updatedUser = {
        ...currentUser,
        username: formData.username,
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await updatePassword(
        currentUser.id,
        formData.currentPassword,
        formData.newPassword
      );
      
      setSuccess('Password updated successfully');
      setOpenPasswordDialog(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      setError(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mb: 4 }}
          >
            Back to Dashboard
          </Button>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              src={getAvatarUrl(currentUser.username)}
              sx={{
                width: 120,
                height: 120,
                margin: '0 auto',
                mb: 2,
                border: `4px solid ${theme.palette.primary.main}`,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              {currentUser.username}'s Profile
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {currentUser.email}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={!editMode || isLoading}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!editMode ? (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                  disabled={isLoading}
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleUpdateProfile}
                    disabled={isLoading}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setEditMode(false);
                      setFormData(prev => ({
                        ...prev,
                        username: currentUser.username,
                      }));
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenPasswordDialog(true)}
              disabled={isLoading}
            >
              Change Password
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              disabled={isLoading}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Container>

      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Current Password"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            disabled={isLoading}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            disabled={isLoading}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenPasswordDialog(false);
              setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              }));
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePassword}
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Profile; 