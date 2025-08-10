'use client'

import { useState, useEffect } from "react";
import { firestore } from "@/firebase";
import { Box, Stack, Typography, Button, TextField, MenuItem, Divider, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { collection, addDoc, getDocs, query, deleteDoc, doc } from "firebase/firestore";
import dayjs from 'dayjs'; // For handling dates
import Link from 'next/link';

export default function Home() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [festival, setFestival] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss')); // Set default to today
  const [note, setNote] = useState('');
  const [reference, setReference] = useState('');
  const [residentName, setResidentName] = useState('');
  const [residentPhone, setResidentPhone] = useState('');
  const [residentNames, setResidentNames] = useState('');
  const [residentPhones, setResidentPhones] = useState('');
  const [type, setType] = useState(''); // Entry type (Income/Expense)
  const [view, setView] = useState('all'); // Filter view for history

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
    expenseList.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    setExpenses(expenseList);
  };

  const updateResidents = async () => {
    const snapshot = query(collection(firestore, 'directory'));
    const docs = await getDocs(snapshot);
    const residentNames = {};
    const residentPhones = {};
    
    docs.forEach((doc) => {
      const { Reference, ResidentName, ResidentPhone } = doc.data();

      // Store resident names and phones in objects for quick access
      residentNames[Reference] = ResidentName;
      residentPhones[Reference] = ResidentPhone;
    });

    setResidentNames(residentNames);
    setResidentPhones(residentPhones);
  };  

  const addExpense = async () => {
    if (!amount || !festival || !category || !date || !type || !reference) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    const amountValue = type === 'Income' ? Number(amount) : -Number(amount);

    await addDoc(collection(firestore, 'expense'), {
      Amount: amountValue,
      Festival: festival,
      Category: category,
      Date: date,
      Note: note,
      Reference: reference,
      ResidentName: residentName,
      ResidentPhone: residentPhone,
      Type: type // Save the type in the database
    });
    await updateExpenses();

    // Send SMS notification
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: residentPhone, body: "Test message - Hello from CSP" }),
    });

    const data = await res.json();
    if (data.success) {
      console.log('SMS sent successfully!');
    } else {
      console.error("Failed to send SMS: ${data.error}");
    }

    // Reset form fields
    resetForm();
  };

  const removeExpense = async (id) => {
    if(confirm("Are you sure you want to delete?"))
    {
      await deleteDoc(doc(firestore, 'Expense', id));
      await updateExpenses();
    }
  };

  const resetForm = () => {
    setAmount('');
    setFestival('');
    setCategory('');
    setDate(dayjs().format('YYYY-MM-DD HH:mm:ss')); // Reset to today's date
    setNote('');
    setReference('');
    setResidentName('');
    setResidentPhone('');
    setType('');
  };

  useEffect(() => {
    updateExpenses();
    updateResidents();
  }, []);

  const incomeTotal = expenses
    .filter(expense => expense.Amount > 0)
    .reduce((acc, expense) => acc + Number(expense.Amount), 0);
  
  const expenseTotal = expenses
    .filter(expense => expense.Amount < 0)
    .reduce((acc, expense) => acc + Number(expense.Amount), 0);

  // Filtered expenses based on the selected view
  const filteredExpenses = expenses.filter(expense => {
    if (view === 'income') return expense.Amount > 0;
    if (view === 'expense') return expense.Amount < 0;
    return true; // 'all' view shows both income and expenses
  });

  const setResident = (value) => {
    //setReference(value);

    if (!residentNames[value]) {
      setResidentName('');
    } else {
      setResidentName(residentNames[value]);
    }

    if (!residentPhones[value]) {
      setResidentPhone('');
    } else {
      setResidentPhone("+91" + residentPhones[value]);
    }
  };

  // Categories based on selected type
  const getCategories = () => {
    if (type === 'Income') {
      return ["Contribution", "Sponsorship", "External"];
    }
    return ["Transport", "Prasadam", "Electricals", "Decoration", "Puja", "Bhandara", "Others"];
  };

  // Festivals based on selected type
  const getFestivals = () => {
    if (type === 'Income') {
      return ["All Festivals","Ganesh Festival","Dussehra","Bathukamma","Christmas","New Year","Shankranti","Republic Day","Holi","Sri Rama Navami","Independence Day", "Janmasthmi"];
    }
    return ["Ganesh Festival","Dussehra","Bathukamma","Christmas","New Year","Shankranti","Republic Day","Holi","Sri Rama Navami","Independence Day", "Janmasthmi"];
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f7f7f7"
      sx={{ scrollBehavior: 'smooth' }} // Add smooth scrolling
    >
      <Box width="500px">
      <p>&nbsp;</p>
      <p>&nbsp;</p>
        <Typography variant="h4" align="center" color="#192bc2" gutterBottom>
          JPNV Block 1 Cultural Fund
        </Typography>
        
        {/* Balance Section */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h6">Your Balance</Typography>
          <Typography variant="h5">₹{incomeTotal + expenseTotal}</Typography>
          <Stack direction="row" justifyContent="space-around" mt={2}>
            <Box textAlign="center">
              <Typography variant="body1">INCOME</Typography>
              <Typography variant="h6" color="green">₹{incomeTotal}</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box textAlign="center">
              <Typography variant="body1">EXPENSE</Typography>
              <Typography variant="h6" color="red">₹{Math.abs(expenseTotal)}</Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
        <Link href="/report">
        <Button variant="contained">View Flat-Wise Contributions</Button>
        </Link>&nbsp;&nbsp;
        <Link href="/search">
        <Button variant="contained">Search Contributions</Button>
        </Link>
        </Box>
        <p>&nbsp;</p>

        {/* Add New Entry Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Add New Entry
          </Typography>
          <Divider />
          <p>&nbsp;</p>
          <Stack spacing={2}>
            <TextField
              select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              fullWidth
            >
              <MenuItem value="Income">Income</MenuItem>
              <MenuItem value="Expense">Expense</MenuItem>
            </TextField>
            <TextField
              select
              label="Festival"
              value={festival}
              onChange={(e) => setFestival(e.target.value)}
              fullWidth
              disabled={!type} // Disable until type is selected
            >
              {getFestivals().map(cat => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              fullWidth
              disabled={!type} // Disable until type is selected
            >
              {getCategories().map(cat => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Flat No/Reference"
              value={reference}
              onChange={(e) => { setReference(e.target.value); setResident(e.target.value);}}
              fullWidth
            />
            <TextField
              label="Resident Name"
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              fullWidth
              style={{ display: !type || type === "Expense" ? 'none' : 'block' }}
            />
            <TextField
              label="Resident Phone"
              value={residentPhone}
              onChange={(e) => setResidentPhone(e.target.value)}
              fullWidth
              style={{ display: !type || type === "Expense" ? 'none' : 'block' }}
            />
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
            />
            <TextField
              label="Date"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
            />
            <TextField
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              color="primary"
              onClick={addExpense}
              fullWidth
            >
              Add Entry
            </Button>
            <p>&nbsp;</p>
          </Stack>
        </Box>

        {/* History Section */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            History
          </Typography>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(e, newView) => setView(newView)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="income">Income</ToggleButton>
            <ToggleButton value="expense">Expense</ToggleButton>
          </ToggleButtonGroup>
          <Divider />
          <Stack mt={2} spacing={1}>
            {filteredExpenses.map(({ id, Festival, Category, Amount, Date, Note, Reference, ResidentName, ResidentPhone }) => (
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
                  <Typography variant="body2">{Date}</Typography>
                  <Typography variant="body1">{Festival}, {Category}</Typography>
                  <Typography variant="body2">Reference: {Reference}</Typography>
                  <Typography variant="body2">{ResidentName} ({ResidentPhone})</Typography>
                  <Typography variant="body2">Note: {Note}</Typography>
                </Box>
                <Typography variant="h6" color={Amount > 0 ? "green" : "red"}>
                  {Amount > 0 ? `+ ₹${Amount}` : `- ₹${Math.abs(Amount)}`}
                </Typography>
                <Button variant="text" color="error" onClick={() => removeExpense(id)}>
                  DEL
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>

        
      </Box>
    </Box>
  );
}
