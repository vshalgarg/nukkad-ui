// customerProfileSchema.js
import { z } from 'zod';

export const customerProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Enter valid name')
    .regex(/^[A-Za-z\s]+$/, 'Name must contain only letters'),
  email: z.string().email('Enter valid email'),
  dob: z.preprocess(
    val => (val === null || val === '' ? undefined : val), // convert null/empty to undefined
    z.date({
      required_error: 'DOB is required',
      invalid_type_error: 'Enter a valid date',
    }),
  ),

  // addressLine1: z.string().min(2, 'Enter valid Address'),
  // landmark: z.string().min(2, 'Please enter a landmark'),
  // city: z
  //   .string()
  //   .min(2, 'Enter valid name')
  //   .regex(/^[A-Za-z\s]+$/, 'City must contain only letters'),
  // state: z
  //   .string()
  //   .min(2, 'Enter valid name')
  //   .regex(/^[A-Za-z\s]+$/, 'State must contain only letters'),
  // pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
});

export const storekeeperProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must contain at least 2 characters')
    .regex(/^[A-Za-z\s]+$/, 'Name must contain only letters'),
  storeName: z.string().min(2, 'Store name must contain at least 2 characters'),
  contactNumber: z
    .string()
    .regex(/^\d{10}$/, 'Contact number must be exactly 10 digits'),
  gstNum: z.string().length(15, 'GST IN must be exactly 15 characters'),
  // .regex(
  //   /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  //   'Invalid GST IN format',
  // )
  addressLine1: z
    .string()
    .min(2, 'Address Line 1 must contain at least 2 characters')
    .regex(/^[a-zA-Z0-9\s,\/-]*$/, 'Invalid characters in address'),
  addressLine2: z
    .string()
    .regex(/^[a-zA-Z0-9\s,\/-]*$/, 'Invalid characters in address')
    .optional(),
  landmark: z.string().min(2, 'Landmark must contain at least 2 characters'),

  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
});

const addressSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please enter your name.')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces.'),
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, 'Please enter valid 10-digit mobile number.'),
  addressLine1: z.string().trim().min(1, 'Please enter Address Line 1.'),
  addressLine2: z.string().optional(),
  landmark: z.string().trim().min(2, 'Please enter a valid landmark.'),
  city: z
    .string()
    .trim()
    .min(1, 'Please enter city.')
    .regex(/^[a-zA-Z\s]+$/, 'City can only contain letters and spaces.'),
  state: z
    .string()
    .trim()
    .min(1, 'Please enter state.')
    .regex(/^[a-zA-Z\s]+$/, 'State can only contain letters and spaces.'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits.'),
});

export const validateCustomerProfile = formData => {
  const result = customerProfileSchema.safeParse(formData);
  if (!result.success) {
    const fieldErrors = {};
    let message = '';

    for (const err of result.error.errors) {
      const field = err.path[0];
      if (field) fieldErrors[field] = true;
      if (!message) message = err.message;
    }

    return { isValid: false, fieldErrors, message };
  }

  return { isValid: true, fieldErrors: {}, message: '' };
};

export const validateStorekeeperProfile = formData => {
  const result = storekeeperProfileSchema.safeParse(formData);

  if (!result.success) {
    const fieldErrors = {};
    let message = '';

    for (const err of result.error.errors) {
      const field = err.path[0];
      if (field) fieldErrors[field] = true;
      if (!message) message = err.message;
    }

    return { isValid: false, fieldErrors, message };
  }

  return { isValid: true, fieldErrors: {}, message: '' };
};

export const validateAddressData = data => {
  const result = addressSchema.safeParse(data);

  if (result.success) {
    return { isValid: true, fieldErrors: {}, message: '' };
  }

  const fieldErrors = {};
  const messages = [];

  for (const issue of result.error.issues) {
    const field = issue.path[0];
    fieldErrors[field] = true;
    messages.push(issue.message);
  }

  return {
    isValid: false,
    fieldErrors,
    message: messages[0],
  };
};
