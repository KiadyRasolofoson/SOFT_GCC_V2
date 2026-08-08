import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Assignment as EvalIcon,
  SwapHoriz as CareerIcon,
  Star as WishIcon,
  Sync as SyncIcon,
  Key as LicenseIcon,
  Notifications as DefaultIcon,
  DoneAll as ReadAllIcon,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

// Mapping type → icône + couleur
const typeConfig = {
  evaluation_assigned: { icon: <EvalIcon />, color: '#1976d2' },
  evaluation_validated: { icon: <EvalIcon />, color: '#2e7d32' },
  career_updated: { icon: <CareerIcon />, color: '#ed6c02' },
  wish_status_changed: { icon: <WishIcon />, color: '#9c27b0' },
  sync_completed: { icon: <SyncIcon />, color: '#0288d1' },
  license_expiring: { icon: <LicenseIcon />, color: '#d32f2f' },
};

function getTypeConfig(type) {
  return typeConfig[type] || { icon: <DefaultIcon />, color: '#757575' };
}

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'À l\'instant';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString('fr-FR');
}

export default function NotificationBell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { notifications, unreadCount, loading, hasMore, markAsRead, markAllAsRead, fetchMore } =
    useNotifications();
  const navigate = useNavigate();

  const handleClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setDrawerOpen(false);
  };

  const toggleDrawer = () => {
    setDrawerOpen((prev) => !prev);
  };

  return (
    <>
      {/* Cloche avec badge — style Bootstrap cohérent avec le template */}
      <li className="nav-item">
        <span
          className="nav-link count-indicator"
          onClick={toggleDrawer}
          style={{ cursor: 'pointer' }}
        >
          <i className="mdi mdi-bell" style={{ fontSize: '1.25rem' }}></i>
          {unreadCount > 0 && (
            <span className="count-symbol bg-danger" style={{ top: 18, right: 0 }}></span>
          )}
          {unreadCount > 0 && (
            <span className="count-number bg-danger">{unreadCount}</span>
          )}
        </span>
      </li>

      {/* Drawer latéral — MUI (overlay, pas de conflit avec Bootstrap) */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 400, maxWidth: '90vw' } }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
          <Button
            size="small"
            startIcon={<ReadAllIcon />}
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Tout marquer lu
          </Button>
        </Box>

        {/* Liste des notifications */}
        {loading && notifications.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <Typography variant="h3" sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}>
              🔔
            </Typography>
            <Typography color="text.secondary">Aucune notification</Typography>
          </Box>
        ) : (
          <List sx={{ py: 0, flex: 1, overflow: 'auto' }}>
            {notifications.map((notification, index) => {
              const config = getTypeConfig(notification.type);
              return (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleClick(notification)}
                      sx={{
                        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                        py: 1.5,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: config.color, width: 36, height: 36 }}>
                          {config.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            fontWeight={notification.isRead ? 400 : 600}
                            noWrap
                          >
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'block' }}>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {timeAgo(notification.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              );
            })}

            {/* Bouton "Voir plus" */}
            {hasMore && (
              <Box sx={{ textAlign: 'center', py: 1.5 }}>
                <Button
                  size="small"
                  onClick={fetchMore}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : null}
                >
                  Voir plus
                </Button>
              </Box>
            )}
          </List>
        )}
      </Drawer>
    </>
  );
}
