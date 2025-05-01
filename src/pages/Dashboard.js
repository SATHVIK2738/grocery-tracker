import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  getGroceryItems,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  getExpiringItems,
  logoutUser,
} from '../services/apiService';

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

  // Get user data from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  // Load items
  const loadItems = useCallback(async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const fetchedItems = await getGroceryItems();
      setItems(fetchedItems);

      const expiring = await getExpiringItems();
      setExpiringItems(expiring);

      // Calculate statistics
      const stats = {
        total: fetchedItems.length,
        expiring: expiring.length,
        expired: fetchedItems.filter(item => new Date(item.expiry_date) < new Date()).length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading items:', error);
      setError('Error loading items');
      if (error.message.includes('unauthorized')) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingItem) {
        await updateGroceryItem(editingItem._id, formData);
      } else {
        await addGroceryItem(formData);
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
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteGroceryItem(itemId);
        loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        setError('Error deleting item');
      }
    }
  };

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ color: theme.palette.primary.dark }}>
            Welcome, {currentUser.username}!
          </Typography>
          <Box>
            <IconButton
              color="primary"
              onClick={() => navigate('/profile')}
              sx={{ mr: 1 }}
            >
              <PersonIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={handleLogout}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <Typography variant="h6">Total Items</Typography>
              <Typography variant="h3">{stats.total}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
              }}
            >
              <Typography variant="h6">Expiring Soon</Typography>
              <Typography variant="h3">{stats.expiring}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              }}
            >
              <Typography variant="h6">Expired</Typography>
              <Typography variant="h3">{stats.expired}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper
          sx={{
            p: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Your Grocery Items</Typography>
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
            >
              Add Item
            </Button>
          </Box>

          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <Paper
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(item)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    {item.name}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Category: {item.category}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Quantity: {item.quantity}
                  </Typography>
                  <Typography color="textSecondary">
                    Purchase Date: {new Date(item.purchase_date).toLocaleDateString()}
                  </Typography>
                  <Typography
                    color={
                      new Date(item.expiry_date) < new Date()
                        ? 'error'
                        : new Date(item.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        ? 'warning'
                        : 'textSecondary'
                    }
                  >
                    Expiry Date: {new Date(item.expiry_date).toLocaleDateString()}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Item Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Purchase Date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Expiry Date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default Dashboard; 