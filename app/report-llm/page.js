'use client'
// This file is a client-side component for generating financial reports using an LLM
// It allows users to input a query and fetch a report based on that query.

import { useState } from "react";
import { Box, Stack, Typography, Divider, Button } from "@mui/material";

export default function ReportPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [query, setQuery] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setReport("");

    try {
      const res = await fetch("/api/generate-report-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: query })
      });

      const data = await res.json();
      setReport(data.report || "No report generated");
    } catch (err) {
      console.error(err);
      setReport("Error generating report");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
        <Typography variant="h4" align="center" color="#192bc2" gutterBottom>
          Generate Financial Report
        </Typography>
      <h1></h1>

      <textarea
        rows={4}
        placeholder="Enter your query here (leave blank for default report)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          fontSize: "1rem"
        }}
      />

      <button
        onClick={fetchReport}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "1rem",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        {loading ? "Generating..." : "Generate Report"}
      </button>
      <button
            onClick={goBack}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg"
            style={{ marginLeft: "10px", padding: "10px 20px", fontSize: "1rem",border: "none",
          borderRadius: "5px" }}
      >
        Back
      </button>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "5px",
          whiteSpace: "pre-wrap"
        }}
        dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, "<br>") }}
      />
    </div>
  );
}