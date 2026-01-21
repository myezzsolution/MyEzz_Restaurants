// This is a MOCK login to test your UI while waiting for real Supabase keys
export const login = async ({ email, password }) => {
  return new Promise((resolve, reject) => {
    console.log("Mocking login for:", email);
    
    setTimeout(() => {
      if (!email || !password) {
        reject(new Error("Email and password are required"));
      } else {
        // This simulates a successful response from a server
        resolve({
          user: {
            id: "mock-user-123",
            email: email,
            name: "Test Restaurant Owner",
          },
        });
      }
    }, 1000); // 1 second delay
  });
};

export const signup = async ({ name, email, password }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!name || !email || !password) {
        reject(new Error("All fields are required"));
      } else {
        resolve({
          user: { id: "mock-user-123", name, email },
        });
      }
    }, 1000);
  });
};