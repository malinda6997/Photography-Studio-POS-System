// Test login with detailed error logging
const https = require('https');

console.log('🧪 Testing Shine Art Studio Login API...\n');

const testData = [
  { email: 'admin@shine.com', password: 'admin123', role: 'admin' },
  { email: 'staff@shine.com', password: 'staff123', role: 'staff' }
];

async function testLogin(credentials) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      email: credentials.email,
      password: credentials.password
    });

    const options = {
      hostname: 'photography-studio-pos-system.vercel.app',
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    console.log(`📧 Testing ${credentials.role}: ${credentials.email}`);

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (d) => {
        body += d;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            console.log(`   ✅ Success: ${response.user.name} (${response.user.role})`);
          } catch (e) {
            console.log(`   ✅ Success but response parsing failed: ${body.substring(0, 100)}...`);
          }
        } else {
          try {
            const error = JSON.parse(body);
            console.log(`   ❌ Error: ${error.error || 'Unknown error'}`);
          } catch (e) {
            console.log(`   ❌ Error: ${res.statusCode} - ${body.substring(0, 100)}...`);
          }
        }
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Network Error: ${error.message}\n`);
      resolve();
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  for (const credentials of testData) {
    await testLogin(credentials);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('🏁 Test completed!\n');
  console.log('If you see ✅ Success above, the API is working.');
  console.log('If you see ❌ Error, there may be an issue with the database or environment variables.');
}

runTests();