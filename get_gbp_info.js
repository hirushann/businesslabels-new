const accessToken = "YOUR_ACCESS_TOKEN";

async function run() {
  try {
    // List Accounts
    console.log("Fetching accounts...");
    const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!accountsRes.ok) {
      console.log("Accounts Error:", await accountsRes.text());
      return;
    }
    const accountsData = await accountsRes.json();
    console.log("Accounts:", JSON.stringify(accountsData, null, 2));

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      console.log("No accounts found for this user.");
      return;
    }

    const accountId = accountsData.accounts[0].name; // e.g. "accounts/12345"
    
    console.log(`\nFetching locations for ${accountId}...`);
    const locationsRes = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=name,title`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!locationsRes.ok) {
      console.log("Locations Error:", await locationsRes.text());
      return;
    }
    const locationsData = await locationsRes.json();
    console.log("Locations:", JSON.stringify(locationsData, null, 2));
    
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
