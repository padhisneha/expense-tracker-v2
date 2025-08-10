import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function POST(request) {
    console.log('Received request to send SMS');

  try {
    const body = await request.json();
    const { to, body: messageBody } = body;

    console.log('To:', to);
    console.log('Message Body:', messageBody);
    console.log('From Phone:', fromPhone);

    if (!to || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Missing "to" or "body"' },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      to,
      from: fromPhone,
      body: messageBody,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('Twilio Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
