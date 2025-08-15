// app/api/generateReport/route.js
import { NextResponse } from 'next/server';
import { firestore } from "@/firebase";
import { collection, getDocs } from 'firebase/firestore';

/**
 * GET handler - helpful for testing in browser.
 * Avoids Vercel returning a 405 when accessing this endpoint directly.
 */
export async function GET() {
  return NextResponse.json({
    message:
      "Generate Report LLM API. Please send a POST request with JSON { userQuery: '...' }.",
    usage: "POST /api/generate-report-llm",
    status: "OK",
  });
}

/**
 * POST handler - handles LLM report generation.
 */
export async function POST(req) {
  try {
    // Read the JSON body from request
    const body = await req.json();
    const actualQuery =
      body?.userQuery?.trim() || "Generate a financial report for all festivals.";

    // Fetch all expense table data
    const snapshot = await getDocs(collection(firestore, 'expense'));
    const rawData = snapshot.docs.map(doc => doc.data());

    // Filter / aggregate before sending to LLM
    const filteredData = processData(rawData, actualQuery);

    // Generate report from LLM
    const llmResult = await generateFinancialReport(actualQuery, filteredData);

    return NextResponse.json({
      success: true,
      query: actualQuery,
      report: llmResult,
    });
  } catch (err) {
    console.error("Error in /api/generate-report-llm:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "An unexpected error occurred while generating the LLM report.",
      },
      { status: 500 }
    );
  }
}

/**
 * Example placeholder function for generating report via LLM.
 * Replace this with your actual LLM API integration code.
 */
async function generateFinancialReport(actualQuery, filteredData) {
    // This function should call your LLM API (e.g. Groq, OpenAI) with the filtered data
    // and the user query, then return the generated report text.

    // Prepare prompt for LLaMA
    // This is a system prompt that guides the LLM on how to process the data
    // and what to focus on based on the user query.
    const systemPrompt = `
You are a financial report assistant for a cultural committee.
You will be given:
- A set of financial records (donations and expenses)
- A user query that tells you what to focus on

Your job:
1. **Filter & analyze** ONLY according to the user query.
2. **Group** data by relevant fields if requested (e.g. by date, category, etc.).
3. **Generate a concise report** summarizing the findings.
4. **Use clear, simple language** suitable for a general audience.
5. **Do not include** any data not relevant to the query.
6. **Focus on financial insights**: totals, trends, key contributors, etc.
7. **Avoid technical jargon** unless specifically requested.
8. **If the query is vague**, provide a general overview of the financial situation.
9. **If the query is specific**, focus on that aspect and provide detailed insights.
- Use the data provided to answer the query.
- Do not make assumptions beyond the data.
- If the query asks for a summary, provide a summary of the filtered data.
- If the query asks for specific details, provide those details.
- If the query asks for trends, highlight any trends in the data.
- If the query asks for comparisons, provide comparisons based on the data.
- If the query asks for totals, provide the totals based on the filtered data.
- If the query asks for a breakdown, provide a breakdown of the filtered data.
- If the query asks for a report, generate a report based on the filtered data.
- If the query asks for a summary of contributions, provide a summary of contributions.
- If the query asks for a summary of expenses, provide a summary of expenses.
- If the query asks for a summary of donations, provide a summary of donations.
- If the query asks for a summary of income, provide a summary of income.
- If the query asks for a summary of expenses, provide a summary of expenses.
- If the query asks for a summary of financials, provide a summary of financials.
- If the query asks for a summary of the financial situation, provide a summary of the financial situation.
- If the query asks for a summary of the financial report, provide a summary of the financial report.
- If the query asks for a summary of the financial contributions, provide a summary of the financial contributions.
- If the query asks for a summary of the financial expenses, provide a summary of the financial expenses.
- If the query asks for a summary of the financial donations, provide a summary of the financial donations.
- If the query asks for a summary of the financial income, provide a summary of the financial income.
- If the query asks for a summary of the financial expenses, provide a summary of the financial expenses.
- If the query asks for a summary of the financials, provide a summary of the financials.
- If the query asks for a summary of the financial situation, provide a summary of the financial situation.
- If the query asks for a summary of the financial report, provide a summary of the financial report.
- If the query asks for a summary of the financial contributions, provide a summary of the financial contributions.
- If the query asks for a summary of the financial expenses, provide a summary of the financial expenses.

⚠️ Do NOT include unrelated data — strictly follow the user query.
`;

    // Call Groq LLaMA API with fetch
    const llamaRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Data: ${JSON.stringify(filteredData)}\n\nQuery: ${actualQuery}` }
        ],
        temperature: 0.2
      })
    });

    if (!llamaRes.ok) {
      throw new Error(`Groq API error: ${llamaRes.status} ${llamaRes.statusText}`);
    }

    const llamaData = await llamaRes.json();

    return llamaData.choices[0]?.message?.content || '';
}

// Utility to filter & group data before sending to LLM
function processData(data, query) {
  const lowerQuery = query.toLowerCase();
  let filtered = [...data];

  // ---- Filtering ----
  const filterFields = ["ResidentName", "Reference", "Type", "Category", "Festival", "Date"];
  
  for (const field of filterFields) {
    // Try to find partial matches from query
    const match = data.find(item =>
      (item[field] || "").toString().toLowerCase().includes(lowerQuery)
    );
    if (match) {
      filtered = filtered.filter(item =>
        (item[field] || "").toString().toLowerCase().includes(lowerQuery)
      );
    }
  }

  // ---- Date-specific filtering if query has explicit date pattern ----
  const dateMatch = lowerQuery.match(/\d{4}-\d{2}-\d{2}/);
  if (dateMatch) {
    filtered = filtered.filter(item => (item.Date || "").startsWith(dateMatch[0]));
  }

  // ---- Grouping ----
  // Syntax: "group by category", "group by festival", "group by residentname"
  const groupMatch = lowerQuery.match(/group by (\w+)/);
  if (groupMatch) {
    const groupFieldRaw = groupMatch[1]; // e.g. 'category'
    const groupField = filterFields.find(f => f.toLowerCase() === groupFieldRaw.toLowerCase());

    if (groupField) {
      const grouped = {};
      for (const item of filtered) {
        const key = item[groupField] || "Unknown";
        if (!grouped[key]) grouped[key] = 0;
        grouped[key] += Number(item.Amount) || 0;
      }
      filtered = Object.entries(grouped).map(([key, total]) => ({
        [groupField]: key,
        Total: total
      }));
    }
  }

  return filtered;
}
