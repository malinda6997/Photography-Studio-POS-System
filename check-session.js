// Quick test to see current user status
console.log("Testing current user session...");

fetch("http://localhost:3000/api/auth/session", {
  credentials: "include",
})
  .then((res) => res.json())
  .then((data) => {
    console.log("Current user:", data.user);
    if (data.user) {
      console.log(`✅ Logged in as: ${data.user.name} (${data.user.email})`);
    } else {
      console.log("❌ Not logged in");
    }
  })
  .catch((err) => console.error("Error:", err));
