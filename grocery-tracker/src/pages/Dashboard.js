import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  useTheme,
  alpha,
  Fade,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExitToApp as LogoutIcon,
  Kitchen as KitchenIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import {
  getItems,
  addItem,
  updateItem,
  deleteItem,
  getExpiringItems,
} from '../services/apiService';
import { sendExpiryNotification } from '../services/emailService';

function Dashboard() {
  const [items, setItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    purchase_date: '',
    expiry_date: '',
  });
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    expiring: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  // Get user data and token from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const token = localStorage.getItem('token');

  // Load items
  const loadItems = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const items = await getItems(token);
      setItems(items);

      const expiring = await getExpiringItems(token);
      setExpiringItems(expiring);

      // Calculate statistics
      const stats = {
        total: items.length,
        expiring: expiring.length,
        expired: items.filter(item => new Date(item.expiry_date) < new Date()).length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading items:', error);
      setError('Error loading items');
      if (error.message.includes('Invalid token')) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingItem) {
        await updateItem(token, editingItem._id, formData);
      } else {
        await addItem(token, formData);
      }

      setOpenDialog(false);
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        quantity: '',
        purchase_date: '',
        expiry_date: '',
      });
      loadItems();
    } catch (error) {
      console.error('Error saving item:', error);
      setError('Error saving item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      purchase_date: new Date(item.purchase_date).toISOString().split('T')[0],
      expiry_date: new Date(item.expiry_date).toISOString().split('T')[0],
    });
    setOpenDialog(true);
  };

  const handleDelete = async (itemId) => {
    try {
      await deleteItem(token, itemId);
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Error deleting item');
    }
  };

  // Add this function to handle email notifications
  const handleSendNotification = async () => {
    try {
      const expiringItems = items.filter(item => {
        const expiryDate = new Date(item.expiry_date);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return expiryDate <= threeDaysFromNow && expiryDate >= new Date();
      });

      if (expiringItems.length > 0) {
        await sendExpiryNotification(currentUser.email, expiringItems);
        setError('');
      } else {
        setError('No items are expiring soon');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setError('Failed to send notification');
    }
  };

  // Redirect if not authenticated
  if (!currentUser || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#e8f5e9',
        backgroundImage: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
        pt: 4,
        pb: 6,
      }}
    >
      <Container>
        <Fade in={true} timeout={1000}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            backgroundColor: 'white',
            p: 3,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <KitchenIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 'bold', 
                color: theme.palette.primary.main,
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}>
                Grocery Tracker
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSendNotification}
                startIcon={<WarningIcon />}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Check Expiry
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Fade>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: '200ms' }}>
              <Card sx={{ 
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                },
                transition: 'all 0.3s ease',
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ 
                    mb: 3, 
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}>
                    <KitchenIcon /> Statistics
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }}>
                      <KitchenIcon sx={{ color: theme.palette.primary.main }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {stats.total}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Items
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    }}>
                      <TimerIcon sx={{ color: theme.palette.warning.main }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {stats.expiring}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Expiring Soon
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                    }}>
                      <WarningIcon sx={{ color: theme.palette.error.main }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {stats.expired}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Expired Items
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12} md={8}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: '400ms' }}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3 
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: theme.palette.primary.main,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}>
                      <KitchenIcon /> Your Items
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingItem(null);
                        setFormData({
                          name: '',
                          category: '',
                          quantity: '',
                          purchase_date: '',
                          expiry_date: '',
                        });
                        setOpenDialog(true);
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Add Item
                    </Button>
                  </Box>

                  {isLoading ? (
                    <Typography>Loading items...</Typography>
                  ) : items.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      color: 'text.secondary',
                    }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        No items found
                      </Typography>
                      <Typography variant="body2">
                        Add some items to get started!
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {items.map((item) => (
                        <Fade in={true} key={item._id}>
                          <Paper
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: new Date(item.expiry_date) < new Date()
                                ? alpha(theme.palette.error.main, 0.1)
                                : expiringItems.some(i => i._id === item._id)
                                ? alpha(theme.palette.warning.main, 0.1)
                                : alpha(theme.palette.success.main, 0.1),
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 'bold',
                                  color: theme.palette.primary.main,
                                }}>
                                  {item.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Category: {item.category}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Quantity: {item.quantity}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Expiry: {new Date(item.expiry_date).toLocaleDateString()}
                                </Typography>
                              </Box>
                              <Box>
                                <IconButton
                                  onClick={() => handleEdit(item)}
                                  sx={{ 
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleDelete(item._id)}
                                  sx={{ 
                                    color: theme.palette.error.main,
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                                    },
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          </Paper>
                        </Fade>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>

        <Dialog
          open={openDialog}
          onClose={() => {
            setOpenDialog(false);
            setEditingItem(null);
            setFormData({
              name: '',
              category: '',
              quantity: '',
              purchase_date: '',
              expiry_date: '',
            });
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            },
          }}
        >
          <DialogTitle sx={{ 
            color: theme.palette.primary.main,
            fontWeight: 'bold',
          }}>
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Item Name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Purchase Date"
                    name="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Expiry Date"
                    name="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => {
                setOpenDialog(false);
                setEditingItem(null);
                setFormData({
                  name: '',
                  category: '',
                  quantity: '',
                  purchase_date: '',
                  expiry_date: '',
                });
              }}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              sx={{
                borderRadius: 2,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default Dashboard; 