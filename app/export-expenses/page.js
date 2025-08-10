'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import Link from 'next/link';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import Papa from 'papaparse';

export default function ExportExpensesPage() {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, 'expense'), orderBy('Date', 'desc'));
      const querySnapshot = await getDocs(q);
      const rows = querySnapshot.docs.map((doc) => doc.data());
      setExpenses(rows);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!expenses.length) return;

    const csv = Papa.unparse(expenses, {
      columns: [
        'Date',
        'Type',
        'Festival',
        'Category',
        'Reference',
        'ResidentName',
        'ResidentPhone',
        'Amount',
        'Note',
        'ReceiptNo'
      ],
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'expenses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
  <Box maxWidth={600} mx="auto" mt={8} p={3} bgcolor="#fff" borderRadius={2} boxShadow={3}>
    <Typography variant="h4" align="center" color="#192bc2" gutterBottom>
      JPNV Block 1 Cultural Fund
    </Typography>

    <Typography variant="h5" gutterBottom mt={2}>
      Export Expenses to CSV
    </Typography>

    {loading ? (
      <Box mt={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    ) : (
      <>
        <Typography mt={2}>Total entries: {expenses.length}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={downloadCsv}
          disabled={!expenses.length}
          sx={{ mt: 3 }}
        >
          Download CSV
        </Button>

        <Link href="/config" passHref>
          <Button variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }}>
            Back to Config
          </Button>
        </Link>
      </>
    )}
  </Box>
  );
}