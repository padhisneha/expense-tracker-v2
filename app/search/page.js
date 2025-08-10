'use client'

import { useState, useEffect } from "react";
import { firestore } from "@/firebase";
import { Box, Stack, Typography, Divider, Button } from "@mui/material";
import { collection, getDocs, query } from "firebase/firestore";
import Link from 'next/link';

export default function ViewOnly() {
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const updateExpenses = async () => {
    const snapshot = query(collection(firestore, 'expense'));
    const docs = await getDocs(snapshot);
    const expenseList = [];
    docs.forEach((doc) => {
      expenseList.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    // Sort expenses by Date in descending order
    expenseList.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    setExpenses(expenseList);
  };

  useEffect(() => {
    updateExpenses();
  }, []);

  // Filter by positive amount and matching reference (if any search term)
  const filteredExpenses = expenses.filter((expense) => {
    return (
      expense.Amount > 0 &&
      expense.Reference &&
      expense.Reference.toString().includes(searchTerm)
    );
  });

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f7f7f7"
      sx={{ scrollBehavior: 'smooth' }}
    >
      <Box width="500px">
        <Typography variant="h4" align="center" color="#192bc2" gutterBottom>
          JPNV Block 1 Cultural Fund
        </Typography>

        <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
          <input
            placeholder="Search by Reference"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px',
              width: '100%',
              maxWidth: '300px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </Box>

        {/* Contribution History */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Contribution Details
          </Typography>
          <Divider />
          <Stack mt={2} spacing={1}>
            {filteredExpenses.map(({ id, Festival, Category, ReceiptNo, Amount, Date, Note, Reference, ResidentName, ResidentPhone}) => (
              <Box
                key={id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                bgcolor="#fff"
                border="1px solid #ddd"
                borderRadius={1}
                padding={2}
              >
                <Box>
                  <Typography variant="body2">{Date}, {ReceiptNo}</Typography>
                  <Typography variant="body2">{Festival}, {Category}</Typography>
                  <Typography variant="body2">Reference: {Reference}</Typography>
                  <Typography variant="body2">{ResidentName} ({ResidentPhone})</Typography>
                  <Typography variant="body2">Note: {Note}</Typography>
                </Box>
                <Typography variant="h6" color="green">
                  + ₹{Amount}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
