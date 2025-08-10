'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  LinearProgress,
} from '@mui/material';
import { firestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function ImportDirectoryPage() {
  const [csvData, setCsvData] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setCsvData(result.data);
        setStatus(`Parsed ${result.data.length} records`);
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        setStatus('Failed to parse CSV');
      },
    });
  };

  const handleImport = async () => {
    if (!csvData.length) return;

    setLoading(true);
    setStatus('Importing to Firebase...');

    try {
      const directoryRef = collection(firestore, 'directory');

      const uploadTasks = csvData.map((row) => {
        return addDoc(directoryRef, row);
      });

      await Promise.all(uploadTasks);
      setStatus(`Successfully imported ${csvData.length} records!`);
    } catch (error) {
      console.error('Import error:', error);
      setStatus('Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={600} mx="auto" mt={8} p={3} bgcolor="#fff" borderRadius={2} boxShadow={3}>
        <Typography variant="h4" align="center" color="#192bc2" gutterBottom>
        JPNV Block 1 Cultural Fund
        </Typography>

        <Typography variant="h5" gutterBottom mt={2}>
        Import Directory CSV
        </Typography>

        <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ marginTop: 20, marginBottom: 20 }}
        />

        <Button
        variant="contained"
        color="primary"
        onClick={handleImport}
        fullWidth
        disabled={!csvData.length || loading}
        >
        {loading ? 'Importing...' : 'Import to Firebase'}
        </Button>

        {loading && <LinearProgress sx={{ mt: 2 }} />}

        <Link href="/config" passHref>
        <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ mt: 2 }}
        >
            Back to Config
        </Button>
        </Link>

        <Snackbar
        open={!!status}
        autoHideDuration={4000}
        onClose={() => setStatus('')}
        >
        <Alert severity="info" onClose={() => setStatus('')}>
            {status}
        </Alert>
        </Snackbar>
    </Box>
  );
}