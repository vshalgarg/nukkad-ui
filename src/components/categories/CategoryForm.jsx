import React, { useState } from 'react';
import { uploadImageToFirebase } from '../../firebase/FirebaseService';
import { toast } from 'react-toastify';

const CategoryForm = ({ onSubmit, isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const removeImage = () => {
    setFile(null);
    setPreview(null);
    const input = document.getElementById('image-upload-input');
    if (input) input.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    setLoading(true);
    try {
      const filePath = `categories/${file.name}_${Date.now()}`;
      const imageUrl = await uploadImageToFirebase(file, filePath);

      await onSubmit({ name, imageUrl });
      resetForm();
      onClose();
    } catch {
      throw err;
    }
    finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setFile(null);
    setPreview(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      {/* Form Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-green-200 w-full max-w-sm max-h-[85vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">New Category</h2>
              <p className="text-green-100 text-sm mt-1">Add category for your store</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col overflow-y-auto space-y-4">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vegetables, Fruits..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200 transition text-sm"
              disabled={loading}
              required
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Image <span className="text-red-500">*</span>
            </label>

            {/* Show Preview with Remove Button */}
            {preview ? (
              <div className="relative inline-block mb-4">
                <img
                  src={preview}
                  alt="Category preview"
                  className="w-32 h-32 object-cover rounded-xl border-4 border-white shadow-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-600 transition"
                  disabled={loading}
                >
                  ×
                </button>
              </div>
            ) : (
              /* Upload Box - only show when no image selected */
              <label
                className={`block w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center p-4 text-center
                  ${loading
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    : 'border-green-400 bg-green-50 hover:bg-green-100 hover:border-green-500'
                  }`}
              >
                <svg className={`w-10 h-10 mb-2 ${loading ? 'text-gray-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className={`text-sm font-semibold ${loading ? 'text-gray-500' : 'text-green-700'}`}>
                  Click to upload image
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>

                <input
                  id="image-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 mt-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryForm;