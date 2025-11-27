// Simple test to check API endpoints
async function testLogin() {
  console.log("Testing login...");

  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@shine.com",
      password: "admin123",
    }),
  });

  console.log("Login response status:", response.status);

  if (response.ok) {
    const data = await response.json();
    console.log("Login success:", data.user);
  } else {
    const error = await response.json();
    console.log("Login error:", error);
  }
}

async function testSession() {
  console.log("Testing session...");

  const response = await fetch("http://localhost:3000/api/auth/session", {
    credentials: "include",
  });

  console.log("Session response status:", response.status);

  if (response.ok) {
    const data = await response.json();
    console.log("Session data:", data.user);
  } else {
    const error = await response.json();
    console.log("Session error:", error);
  }
}

async function testProfile() {
  console.log("Testing profile update...");

  const response = await fetch("http://localhost:3000/api/user/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Admin User Test",
      email: "admin@shine.com",
    }),
    credentials: "include",
  });

  console.log("Profile response status:", response.status);

  if (response.ok) {
    const data = await response.json();
    console.log("Profile update success:", data);
  } else {
    const error = await response.json();
    console.log("Profile update error:", error);
  }
}

// Run tests in sequence
(async () => {
  await testLogin();
  console.log("---");
  await testSession();
  console.log("---");
  await testProfile();
})();
