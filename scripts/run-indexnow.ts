import sitemap from '../src/app/sitemap';

async function runIndexNow() {
  const host = 'aharshit123456.space';
  const key = '4bfa85a3c9e74d12b1897cb5b5c7fe99';
  const keyLocation = `https://${host}/${key}.txt`;
  
  console.log('Generating sitemap URLs...');
  const sitemapEntries = sitemap();
  const urlList = sitemapEntries.map(entry => entry.url);
  
  console.log(`Found ${urlList.length} URLs to submit.`);
  
  const payload = {
    host,
    key,
    keyLocation,
    urlList
  };
  
  console.log('Sending request to IndexNow...');
  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log(`Success! IndexNow returned status: ${response.status} ${response.statusText}`);
    } else {
      const text = await response.text();
      console.error(`Failed! IndexNow returned status: ${response.status} ${response.statusText}`);
      console.error('Response details:', text);
    }
  } catch (error) {
    console.error('Error sending request to IndexNow:', error);
  }
}

runIndexNow();
