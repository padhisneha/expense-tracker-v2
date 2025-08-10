export async function POST(request) {
  try {
    const { to, body, smsApiUrl } = await request.json();

    if (!to || !body || !smsApiUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, body, or smsApiUrl' }),
        { status: 400 }
      );
    }
	
	const smsGatewayApiKey = process.env.SMS_GATEWAY_APIKEY;

    const smsResponse = await fetch(smsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: smsGatewayApiKey,
        to,
        msg: body,
      }),
    });

    const responseText = await smsResponse.text();

    if (!smsResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Gateway Error: ${responseText}` }),
        { status: 502 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: responseText }),
      { status: 200 }
    );
  } catch (error) {
    console.error('SMS Send Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}