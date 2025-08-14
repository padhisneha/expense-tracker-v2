'use client';

import { useSearchParams } from 'next/navigation';

export default function EventDetails() {
  const searchParams = useSearchParams();
  const event = searchParams.get('event');

  // Mock event data
  const eventData = {
    "independance-day": {
      name: "Independence Day Celebration",
      date: "August 15, 2025",
      venue: "Joggers Park, Behind Block 1A",
      program: [
        "Flag Hoisting Ceremony",
        "Refreshments & Breakfast",
      ],
      contact: { name: "Mr Ram (FMS Manager)", phone: "+91 7995434377" },
    },
    "krishna-janmashtami": {
      name: "Sri Krishna Janmashtami Celebration",
      date: "August 16, 2025",
      venue: "Block 1C, Near FMS Office",
      program: [
        "Puja & Aarti",
        "Matka Phod (Kids Event)",
        "Prasad Distribution",
      ],
      contact: { name: "Sunita Ji", phone: "+91 9160607700" },
    },
    "holi": {
      name: "Holi Celebration",
      date: "March 14, 2026",
      venue: "Between Block B and C",
      program: [
        "Color Play & Sprinklers",
        "Snacks & Cold Drinks",
        "Music & Dance",
      ],
      contact: { name: "Mr Ram (FMS Manager)", phone: "+91 7995434377" },
    },
  };

  const details = eventData[event?.toLowerCase()] || {
    name: "Event Details Not Published",
    date: "",
    venue: "",
    program: [],
    contact: {},
  };

  return (
    
    <div className="event-page">
      {/* Page-specific styles */}
      <style jsx>{`
        .event-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(to bottom, #dbeafe, #e9d5ff);
          padding: 20px;
        }
        .event-card {
          background: white;
          max-width: 400px;
          width: 100%;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        .event-card h1 {
          text-align: center;
          color: #6b21a8;
          margin-bottom: 16px;
        }
        .event-card h2 {
          margin-top: 20px;
          color: #374151;
        }
        .event-card p {
          margin-bottom: 8px;
          color: #374151;
        }
        .event-card ul {
          padding-left: 20px;
          margin-bottom: 16px;
        }
        .event-card li {
          margin-bottom: 4px;
          color: #4b5563;
        }
      `}</style>
      <div className="event-card">
        <h1>{details.name}</h1>

        {details.date && (
          <>
            <p><strong>📅 Date:</strong> {details.date}</p>
            <p><strong>📍 Venue:</strong> {details.venue}</p>

            <h2>🎯 Program Details:</h2>
            <br></br>
            <ul>
              {details.program.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <br></br>
            <p>
              <strong>📞 Point of Contact:</strong>{" "}
              <br></br><br></br>{details.contact.name} ({details.contact.phone})
            </p>
          </>
        )}
      </div>

      
    </div>
  );
}