'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/firebase';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  collection,
  doc as firestoreDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import Link from 'next/link';

export default function SmsConfigPage() {
  const [provider, setProvider] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const configDocRef = firestoreDoc(collection(firestore, 'config'), 'sms');

  const fetchConfig = async () => {
    try {
      const docSnap = await getDoc(configDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProvider(data.SmsProvider || '');
        setIp(data.PhoneIP || '');
        setPort(data.HttpPort || '');
      }
    } catch (err) {
      console.error('Error fetching config:', err);
      setError('Failed to load configuration');
    }
  };

  const updateConfig = async () => {
    try {
      await setDoc(configDocRef, {
        SmsProvider: provider,
        PhoneIP: ip,
        HttpPort: port,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Error updating config:', err);
      setError('Failed to update configuration');
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <Box maxWidth={500} mx="auto" mt={8} p={3} bgcolor="#fff" borderRadius={2} boxShadow={3}>
      <Typography variant="h4" align="center" color="#192bc2" gutterBottom>
        JPNV Block 1 Cultural Fund
      </Typography>
      <p>&nbsp;</p>

      <Typography variant="h5" gutterBottom mt={2}>SMS Configuration</Typography>

      <TextField
        select
        label="SMS Provider"
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        fullWidth
        margin="normal"
      >
        <MenuItem value="Twilio">Twilio</MenuItem>
        <MenuItem value="SMSGateway">SMSGateway</MenuItem>
      </TextField>

      <TextField
        label="Phone IP"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        fullWidth
        margin="normal"
      />

      <TextField
        label="HTTP Port"
        value={port}
        onChange={(e) => setPort(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Button
        variant="contained"
        color="primary"
        onClick={updateConfig}
        fullWidth
        sx={{ mt: 2 }}
      >
        Save Configuration
      </Button>

      <Link href="/config" passHref>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Link>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity="success">Configuration saved successfully</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
}