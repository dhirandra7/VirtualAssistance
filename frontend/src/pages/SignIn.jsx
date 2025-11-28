const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Login successful!");
      window.location.href = "/dashboard"; 
    } else {
      setMessage(data.message);
    }
  } catch (err) {
    setMessage("Server error");
  }
};
