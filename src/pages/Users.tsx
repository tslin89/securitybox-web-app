// src/pages/Users.tsx
import React, { useState, useEffect} from 'react';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import UpdateUser from '../components/UpdateUser';
import AddUser from '../components/AddUser';
import UserList from '../components/UserList';

// export default function Users() {
//   const [name, setName] = React.useState('');
//   const [email, setEmail] = React.useState('');
//   const [password, setPassword] = React.useState('');
//   const [saving, setSaving] = React.useState(false);

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setSaving(true);
//     try {
//       // Placeholder for integration with your API/service
//       // e.g., await createUser({ name, email, password })
//       console.log('Save user', { name, email, password });
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <UserList />
//   );
// }

const Users: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddUser = () => {
    setCurrentView('add');
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setCurrentView('edit');
  };

  const handleSuccess = (userId?: number) => {
    setCurrentView('list');
    setSelectedUser(null);
    // Trigger refresh of user list
    setRefreshTrigger(prev => prev + 1);
    if (userId) {
      console.log('User created successfully with ID:', userId);
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedUser(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      {currentView === 'list' && (
        <UserList onAddUser={handleAddUser} onEditUser={handleEditUser} refreshTrigger={refreshTrigger} />
      )}

      {currentView === 'add' && (
        <AddUser onSuccess={handleSuccess} onCancel={handleCancel} />
      )}

      {currentView === 'edit' && selectedUser && (
        <UpdateUser
          userId={selectedUser.userID}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </Box>
  );
};

export default Users;