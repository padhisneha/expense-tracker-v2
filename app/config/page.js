'use client';

import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';

export default function ConfigPage() {
  return (
    <Box
      maxWidth={600}
      mx="auto"
      mt={8}
      p={4}
      bgcolor="#fff"
      borderRadius={2}
      boxShadow={3}
      textAlign="center"
    >
      <Typography variant="h4" color="#192bc2" gutterBottom>
        JPNV Block 1 Cultural Fund
      </Typography>

      <Typography variant="h5" gutterBottom mt={2}>
        Configuration Panel
      </Typography>

      <Box mt={4} display="flex" flexDirection="column" gap={2}>
        <Link href="/smsconfig">
          <Button variant="contained" fullWidth>
            SMS Configuration
          </Button>
        </Link>

        <Link href="/export-expenses">
          <Button variant="contained" fullWidth>
            Export Expenses
          </Button>
        </Link>

        <Link href="/import-directory">
          <Button variant="contained" fullWidth>
            Import Directory
          </Button>
        </Link>
      </Box>

      <Box mt={4}>
        <Link href="/admin123">
          <Button variant="outlined" color="secondary" fullWidth>
            Back
          </Button>
        </Link>
      </Box>
    </Box>
  );
}