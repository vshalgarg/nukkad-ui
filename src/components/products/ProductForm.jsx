import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { uploadImageToFirebase } from '../../firebase/FirebaseService';
import CategoryService from '../../services/categoryService';
import { toast } from 'react-toastify';

const UNIT_OPTIONS = ['WEIGHT', 'VOLUME', 'PACKET'];

// Custom Checkbox Option
const Option = (props) => (
  <components.Option {...props}>
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={props.isSelected}
        onChange={() => null}
        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
      />
      <span>{props.label}</span>
    </div>
  </components.Option>
);

// React Select Green Theme
const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? '#10b981' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #10b981' : 'none',
    borderRadius: '0.75rem',
    padding: '0.25rem',
    '&:hover': { borderColor: '#10b981' }
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#d1fae5',
    borderRadius: '0.5rem',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#065f46',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#059669',
    ':hover': { backgroundColor: '#a7f3d0', color: '#065f46' }
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#d1fae5' : state.isFocused ? '#ecfdf5' : 'white',
    color: '#111827',
    padding: '0.75rem 1rem',
  }),
};

const ProductForm = ({ isOpen, onClose, onSubmit, loading: externalLoading }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await CategoryService.getAllCategories();
        const formatted = cats.map(cat => ({ value: cat.id, label: cat.name }));
        setCategories(formatted);
      } catch (err) {
        toast.error('Failed to load categories');
      }
    }
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const resetForm = () => {
    setName('');
    setUnit('');
    setSelectedCategories([]);
    setImages([]);
    setImagePreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !unit || selectedCategories.length === 0 || images.length === 0) {
      toast.error('Please fill all fields and upload at least one image');
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        images.map(async (file) => {
          const path = `products/${file.name}_${Date.now()}`;
          return await uploadImageToFirebase(file, path);
        })
      );

      const productData = {
        name,
        unit,
        categoryIds: selectedCategories.map(c => c.value),
        imageUrls: uploadedUrls,
      };

      await onSubmit({ items: [productData] });
      resetForm();
      onClose();
    } catch (error) {
      toast.error('Failed to add product: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const isLoading = uploading || externalLoading;

  return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl shadow-2xl border border-green-200 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
      
      {/*Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">New Product</h2>
            <p className="text-green-100 text-sm mt-1">Fill product details</p>
          </div>
          <button 
            onClick={() => { resetForm(); onClose(); }} 
            className="text-white hover:bg-white/20 p-2 rounded-lg transition text-xl"
          >
            ×
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col overflow-y-auto space-y-4">
        
        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200 transition text-sm"
            placeholder="Enter product name"
            required
          />
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-200 transition text-sm"
            required
          >
            <option value="">Select unit</option>
            {UNIT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Categories</label>
          <Select
            options={categories}
            value={selectedCategories}
            onChange={setSelectedCategories}
            isMulti
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            components={{ Option }}
            styles={selectStyles}
            placeholder="Choose categories..."
            className="text-sm"
          />
        </div>

        {/* Images*/}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Images (up to 5)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:text-sm file:font-medium hover:file:bg-green-100 transition"
          />
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {imagePreviews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-16 object-cover rounded-lg border border-green-200"
                />
              ))}
            </div>
          )}
        </div>

        {/*Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 mt-auto">
          <button
            type="button"
            onClick={() => { resetForm(); onClose(); }}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
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
export default ProductForm;