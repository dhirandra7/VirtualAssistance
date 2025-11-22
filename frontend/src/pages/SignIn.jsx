import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function SignIn() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "https://virtualassistance-1-gy7v.onrender.com/api/auth/login",
        formData,
        {
          withCredentials: true,       // <-- IMPORTANT
        }
      );

      toast.success("Login successful");
      navigate("/"); // redirect to home page

      console.log("User logged in:", response.data);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Login failed, try again!"
      );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg p-8 rounded-lg w-80"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>

        <input
          type="email"
          name="email"
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          placeholder="Email"
          required
        />

        <input
          type="password"
          name="password"
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          placeholder="Password"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default SignIn;
