const accessToken = "YOUR_ACCESS_TOKEN";
const url = "https://mybusiness.googleapis.com/v4/accounts/101248527030163402935/locations/797913827393772876/reviews";

async function run() {
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!res.ok) {
      console.log("Error:", await res.text());
      return;
    }
    const data = await res.json();
    console.log("Total Reviews:", data.totalReviewCount);
    console.log("Reviews fetched:", data.reviews ? data.reviews.length : 0);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
