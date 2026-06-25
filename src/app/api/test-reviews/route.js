import { NextResponse } from 'next/server';

export async function GET() {
  // Use the access token provided by the user
  const accessToken = "YOUR_ACCESS_TOKEN";
  const url = "https://mybusiness.googleapis.com/v4/accounts/101248527030163402935/locations/797913827393772876/reviews";

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
 