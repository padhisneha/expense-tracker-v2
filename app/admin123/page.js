'use client'

import { useState, useEffect } from "react";
import { firestore } from "@/firebase";
import {
  Box, Stack, Typography, Button, TextField, MenuItem, Divider,
  ToggleButton, ToggleButtonGroup, Container, Card, CardContent
} from "@mui/material";
import {
  collection, addDoc, getDoc, getDocs, query, orderBy, deleteDoc, doc as firestoreDoc, runTransaction
} from "firebase/firestore";
import dayjs from 'dayjs';
import Link from 'next/link';
import { CircularProgress } from '@mui/material';
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SmsIcon from "@mui/icons-material/Sms";

export default function Home() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Check if already logged in (session storage)
  useEffect(() => {
    const loggedIn = sessionStorage.getItem("isAuthenticated");
    if (loggedIn === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    // Change these values to your desired credentials
    const validUser = "admin";
    const validPass = "pass123";

    if (username === validUser && password === validPass) {
      setIsAuthenticated(true);
      sessionStorage.setItem("isAuthenticated", "true");
    } else {
      alert("Invalid credentials");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("isAuthenticated");
  };

 

  const [isProcessing, setIsProcessing] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [festival, setFestival] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  const [note, setNote] = useState('');
  const [reference, setReference] = useState('');
  const [residentName, setResidentName] = useState('');
  const [residentPhone, setResidentPhone] = useState('');
  const [residentNames, setResidentNames] = useState({});
  const [residentPhones, setResidentPhones] = useState({});
  const [type, setType] = useState('');
  const [view, setView] = useState('all');

  const updateExpenses = async () => {
    const snapshot = query(collection(firestore, 'expense'));
    const docs = await getDocs(snapshot);
    const expenseList = [];
    docs.forEach((doc) => {
      expenseList.push({ id: doc.id, ...doc.data() });
    });
    expenseList.sort((a, b) => new Date(b.Date) - new Date(a.Date));
    setExpenses(expenseList);
  };

  const updateResidents = async () => {
    const snapshot = query(collection(firestore, 'directory'), orderBy('ResidentType', 'asc'));
    const docs = await getDocs(snapshot);
    const names = {};
    const phones = {};
    docs.forEach((doc) => {
      const { Reference, ResidentName, ResidentPhone, ResidentType, ResidentEmail } = doc.data();
      names[Reference] = ResidentName + (ResidentType ? ` (${ResidentType})` : '');
      phones[Reference] = ResidentPhone;
    });
    setResidentNames(names);
    setResidentPhones(phones);
  };

  const addExpense = async () => {
    if (!amount || !festival || !category || !date || !type || !reference) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    setIsProcessing(true); // 👈 Start processing

    const amountValue = type === 'Income' ? Number(amount) : -Number(amount);

    try {
      const receiptNo = type === 'Income' ? await generateReceiptNo() : null;

      await addDoc(collection(firestore, 'expense'), {
        Amount: amountValue,
        Festival: festival,
        Category: category,
        Date: date,
        Note: note,
        Reference: reference,
        ResidentName: residentName,
        ResidentPhone: residentPhone,
        Type: type,
        ...(receiptNo ? { ReceiptNo: receiptNo } : {})
      });

      await updateExpenses();

      /*
      if(type === 'Income' && residentPhone) {

        const configDocRef = firestoreDoc(collection(firestore, 'config'), 'sms');
        const docSnap = await getDoc(configDocRef);
        if (docSnap.exists()) {

          const configData = docSnap.data();
          const { SmsProvider, PhoneIP, HttpPort } = configData; 

          const formattedDate = dayjs(date).format('DD/MM/YYYY');
          const smsMessage = `Thank you for your contribution of Rs ${Math.abs(amountValue)}/- towards Janpriya NileValley Block 1 cultural events. Receipt No: ${receiptNo}, Flat No: ${reference}, Date: ${formattedDate}`;

          const smsApiUrl = `http://${PhoneIP}:${HttpPort}`;
          //const sendSmsPage = (SmsProvider === 'SMSGateway') ? '/api/send-sms-gateway' : '/api/send-sms-twilio';
          const sendSmsPage = '/api/send-sms-twilio';

          if (SmsProvider === 'SMSGateway') {

            const smsGatewayApiKey = process.env.NEXT_PUBLIC_SMS_GATEWAY_APIKEY;

            const res = await fetch(smsApiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                apiKey: smsGatewayApiKey,
                to: residentPhone,
                msg: smsMessage,
              }),
            });

            const responseText = await res.text();

            if (!res.ok) {
              console.error(`Failed to send SMS: ${responseText}`);
            } else {
              console.log('SMS sent successfully!');
            }
          }
          else if (SmsProvider === 'Twilio') {

            // Send SMS
            const res = await fetch(sendSmsPage, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: residentPhone,
                body: smsMessage,
                smsApiUrl: smsApiUrl
              }),
            });

            const data = await res.json();
            if (data.success) {
              console.log('SMS sent successfully!');
            } else {
              console.error(`Failed to send SMS: ${data.error}`);
            }
          }
        }
      }
      */

      resetForm();
    } catch (error) {
      console.error("Error adding entry:", error);
      alert("Something went wrong while saving the entry.");
    } finally {
      setIsProcessing(false); // 👈 Done processing
    }
  };

  const generateReceiptNo = async () => {
    const year = new Date().getFullYear();
    const counterRef = firestoreDoc(firestore, 'counters', `receipt-${year}`);

    try {
      const receiptNo = await runTransaction(firestore, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);

        let current = 0;
        if (counterDoc.exists()) {
          current = counterDoc.data().count || 0;
        }

        const next = current + 1;
        transaction.set(counterRef, { count: next }, { merge: true });

        const padded = String(next).padStart(3, '0');
        return `CUL-${year}-${padded}`;
      });

      return receiptNo;
    } catch (error) {
      console.error("Error generating receipt number in transaction:", error);
      return null;
    }
  };

  const removeExpense = async (id) => {
    if (confirm("Are you sure you want to delete?")) {
      await deleteDoc(firestoreDoc(firestore, 'expense', id));
      await updateExpenses();
    }
  };

  const handleSendSMS = async (reference, residentName, residentPhone, amount, receiptNo, date) => {

    const configDocRef = firestoreDoc(collection(firestore, 'config'), 'sms');
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {

      const configData = docSnap.data();
      const { SmsProvider, PhoneIP, HttpPort } = configData;

      if (SmsProvider === 'SMSGateway') {

        const smsGatewayApiKey = process.env.NEXT_PUBLIC_SMS_GATEWAY_APIKEY;
        const randomStr = Math.random().toString(36).substring(2, 10); // random 8-char string
        const formattedDate = dayjs(date).format('DD/MM/YYYY');
        const smsMessage = `Thank you for your contribution of Rs ${Math.abs(amount)}/- towards Janpriya NileValley Block 1 cultural events. Receipt No: ${receiptNo}, Flat No: ${reference}, Date: ${formattedDate}`;

        //const smsApiUrl = `http://${PhoneIP}:${HttpPort}/?apiKey=${smsGatewayApiKey}&to=${encodeURIComponent(residentPhone)}&msg=${encodeURIComponent(smsMessage)}&r=${randomStr}`;
        const smsApiUrl = `http://${PhoneIP}:${HttpPort}/?apiKey=${smsGatewayApiKey}&to=${residentPhone}&msg=${smsMessage}&r=${randomStr}`;
        //window.open(smsApiUrl, "_blank"); // _blank = new tab
        window.location = smsApiUrl; // replace current page with SMS gateway URL

        //const iframe = document.getElementById("smsIframeContainer");
        //alert(iframe.src);
        //iframe.src = smsApiUrl;
      }
    }
  }

  const handleSendWhatsApp = async (reference, residentName, residentPhone, amount, receiptNo, date) => {
    
    const formattedDate = dayjs(date).format('DD/MM/YYYY');
    const message = `Thank you for your contribution of Rs ${Math.abs(amount)}/- towards Janpriya NileValley Block 1 cultural events. Receipt No: ${receiptNo}, Flat No: ${reference}, Date: ${formattedDate}`;
    const phoneNumber = residentPhone.replace(/\D/g, ''); // Remove non-numeric characters

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  }

  const resetForm = () => {
    setAmount('');
    setFestival('');
    setCategory('');
    setDate(dayjs().format('YYYY-MM-DD HH:mm:ss'));
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

  const incomeTotal = expenses.filter(e => e.Amount > 0).reduce((acc, e) => acc + Number(e.Amount), 0);
  const expenseTotal = expenses.filter(e => e.Amount < 0).reduce((acc, e) => acc + Number(e.Amount), 0);

  const filteredExpenses = expenses.filter(e => {
    if (view === 'income') return e.Amount > 0;
    if (view === 'expense') return e.Amount < 0;
    return true;
  });

  const setResident = (value) => {
    setResidentName(residentNames[value] || '');
    setResidentPhone(residentPhones[value] ? residentPhones[value] : '');
  };

  const getCategories = () => {
    return type === 'Income'
      ? ["Contribution", "Sponsorship", "External"]
      : [ "Idol", "Decoration", "Puja Samagri", "Electricals", "Prasadam", "Bhandara", "Sports/Medals", "Transport", "Procession", "Miscellaneous"];
  };

  const getFestivals = () => {
    return type === 'Income'
      ? ["All Festivals", "Janmasthmi", "Ganesh Festival", "Dussehra", "Bathukamma", "Christmas", "New Year", "Shankranti", "Republic Day", "Holi", "Sri Rama Navami", "Independence Day" ]
      : ["All Festivals", "Janmasthmi", "Ganesh Festival", "Dussehra", "Bathukamma", "Christmas", "New Year", "Shankranti", "Republic Day", "Holi", "Sri Rama Navami", "Independence Day"];
    
    //const list = ["Ganesh Festival", "Dussehra", "Bathukamma", "Christmas", "New Year", "Shankranti", "Republic Day", "Holi", "Sri Rama Navami", "Independence Day", "Janmasthmi"];
    //return type === 'Income' ? ["All Festivals", ...list] : list;
  };



  const loginForm = (
    <>
      <Container maxWidth="xs" sx={{ mt: 4 }}>
      {/* Header */}
      <Typography variant="h5" align="center" color="#192bc2" gutterBottom>
        JPNV Block 1 Cultural Fund
      </Typography>

      {/* Login Card */}
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" align="center" gutterBottom>
            Admin Panel Login
          </Typography>

          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleLogin}
              sx={{ backgroundColor: "#192bc2", "&:hover": { backgroundColor: "#0f1e87" } }}
              fullWidth
            >
              Login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
    </>
  );

  const adminContent = (
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
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="center"
          alignItems="stretch"
          gap={2}
          mb={2}
          width="100%"
        >
          <Link href="/report" style={{ flex: 1 }}>
            <Button variant="contained" fullWidth>
              Flat-Wise Contributions
            </Button>
          </Link>

          <Link href="/search" style={{ flex: 1 }}>
            <Button variant="contained" fullWidth>
              Search Contributions
            </Button>
          </Link>

          <Link href="/report-llm" style={{ flex: 1 }}>
            <Button variant="contained" fullWidth>
              Financial Report
            </Button>
          </Link>

          <Link href="/config" style={{ flex: 1 }}>
            <Button variant="contained" fullWidth>
              APP Configuration
            </Button>
          </Link>

          <Link href="#" style={{ flex: 1 }}>
            <Button onClick={handleLogout} variant="contained" fullWidth>
              Logout
            </Button>
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

            {isProcessing && (
              <Box display="flex" justifyContent="center">
                <CircularProgress size={24} />
              </Box>
            )}

            <p>&nbsp;</p>
          </Stack>
        </Box>

        {/* History Section */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            &nbsp;
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
          <iframe
            id="smsIframeContainer" 
            name="smsIframeContainer"
            src=""
            style={{ width: "100%", height: "50px", border: 1, borderColor: "#ddd", borderRadius: 8 }}
            title="Send SMS IFrame"></iframe>
          <Stack mt={2} spacing={1}>
            {filteredExpenses.map(({ id, Type, Festival, Category, ReceiptNo, Amount, Date, Note, Reference, ResidentName, ResidentPhone }) => (
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
                  <Typography variant="body2">{Date}<br/>{ReceiptNo}</Typography>
                  {/*
                  <Typography variant="body2">{Festival}, {Category}</Typography>
                  */}
                  <Typography variant="body2">{Reference}</Typography>
                  {Type === 'Income' && (
                  <Typography variant="body2">{ResidentName}</Typography>
                  )}
                  {Note != '' && (
                  <Typography variant="body2">{Note}</Typography>
                  )}
                </Box>
                <Typography variant="h6" color={Amount > 0 ? "green" : "red"}>
                  {Amount > 0 ? `+ ₹${Amount}` : `- ₹${Math.abs(Amount)}`}
                  <br />
                  {Amount > 0 && ResidentPhone != "" && (
                  <Button
                    variant="contained"
                    startIcon={<SmsIcon />}
                    onClick={() => handleSendSMS(Reference, ResidentName, ResidentPhone, Amount, ReceiptNo, Date)}
                    sx={{
                      backgroundColor: "#1976d2", // Blue like SMS
                      color: "white",
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: "bold",
                      borderRadius: "25px",
                      padding: "2px 4px",
                      "&:hover": { backgroundColor: "#115293" },
                      width: "130px"
                    }}
                  >
                    SMS
                  </Button>
                  )}
                  <br />
                  {Amount > 0 && ResidentPhone != "" && (
                  <Button
                    variant="contained"
                    startIcon={<WhatsAppIcon />}
                    onClick={() => handleSendWhatsApp(Reference, ResidentName, ResidentPhone, Amount, ReceiptNo, Date)}
                    sx={{
                      backgroundColor: "#25D366",
                      color: "white",
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: "bold",
                      borderRadius: "25px",
                      padding: "2px 4px",
                      "&:hover": {
                        backgroundColor: "#1EBE5B",
                      },
                      width: "130px"
                    }}
                    fullWidth
                  >
                    WhatsApp
                  </Button>
                  )}
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

  return (
    <div style={{ padding: "20px" }}>
      {isAuthenticated ? adminContent : loginForm}
    </div>
  );
}
