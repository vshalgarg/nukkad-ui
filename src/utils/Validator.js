// src/utils/validator.js

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email))
    errors.email = "Invalid email";
  if (!password) errors.password = "Password is required";
  return errors;
}