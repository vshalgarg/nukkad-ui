// src/components/products/ProductEditForm.jsx
import React, { useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { uploadImageToFirebase, deleteImagesFromFirebase } from '../../firebase/FirebaseService';
import CategoryService from '../../services/CategoryService';
import ProductService from '../../services/ProductService';
import { toast } from 'react-toastify';

const UNIT_OPTIONS = ['WEIGHT', 'VOLUME', 'PACKET'];

const Option = (props) => (
  <components.Option {...props}>
    <div className="flex items-center gap-3">
      <input type="checkbox" checked={props.isSelected} onChange={() => null} className="w-4 h-4 text-green-600 rounded" />
      <span>{props.label}</span>
    </div>
  </components.Option>
);

const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? '#10b981' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #10b981' : 'none',
    borderRadius: '0.75rem',
    padding: '0.25rem',
    '&:hover': { borderColor: '#10b981' }
  }),
  multiValue: (provided) => ({ ...provided, backgroundColor: '#d1fae5', borderRadius: '0.5rem' }),
  multiValueLabel: (provided) => ({ ...provided, color: '#065f46' }),
};

const ProductEditForm = ({ isOpen, onClose, product, onSuccess }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [initialImageUrls, setInitialImageUrls] = useState([]);

  useEffect(() => {
    if (!isOpen || !product) return;

    const load = async () => {
      try {
        const cats = await CategoryService.getAllCategories();
        const formatted = cats.map(c => ({ value: c.id, label: c.name }));
        setCategories(formatted);

        setName(product.name || '');
        const unitArray = Array.isArray(product.unit) ? product.unit : [];
        const firstUnit = unitArray.length > 0 ? unitArray[0].toUpperCase() : '';

        const detectedUnit =
          ['KG', 'GM'].includes(firstUnit) ? 'WEIGHT' :
            ['L', 'ML'].includes(firstUnit) ? 'VOLUME' :
              ['PKT'].includes(firstUnit) ? 'PACKET' : '';

        setUnit(detectedUnit);

        setCurrentImages(product.imageUrls || []);
        setInitialImageUrls(product.imageUrls || []);

        if (product.categoryIds?.length > 0) {
          const matched = formatted.filter(cat => product.categoryIds.includes(cat.value));
          setSelectedCategories(matched);
        }
      } catch (err) {
        toast.error('Failed to load categories');
      }
    };
    load();
  }, [isOpen, product]);

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setNewImages(files);
    setNewPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeCurrentImage = (urlToRemove) => {
    setCurrentImages(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || selectedCategories.length === 0) {
      toast.error('All fields are required');
      return;
    }

    setSaving(true);
    try {
      let finalUrls = [...currentImages];

      let uploaded = [];
      if (newImages.length > 0) {
        uploaded = await Promise.all(
          newImages.map(file => uploadImageToFirebase(file, `products/${file.name}_${Date.now()}`))
        );
        finalUrls = [...finalUrls, ...uploaded];
      }

      const removed = initialImageUrls.filter(url => !finalUrls.includes(url));
      if (removed.length > 0) {
        try {
          await deleteImagesFromFirebase(removed);
          console.log('Deleted old images from Firebase');
        } catch (err) {
          console.warn('Some images could not be deleted from Firebase (maybe external URLs)', err);
          // Don't block save if delete fails
        }
      }

      await ProductService.updateProduct(product.id, {
        name: name.trim(),
        unit,
        imageUrls: finalUrls,
        categoryIds: selectedCategories.map(c => c.value)
      });

      toast.success('Product updated successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Something went wrong: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-green-200 w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Edit Product</h2>
              <p className="text-green-100 text-sm">Quick update</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 w-9 h-9 rounded-xl flex items-center justify-center text-2xl">
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
              required
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Unit Type *
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
              required
            >
              <option value="" disabled>Select unit</option>
              <option value="WEIGHT">Weight (KG / GM)</option>
              <option value="VOLUME">Volume (Litre / ML)</option>
              <option value="PACKET">Packet (PKT)</option>
            </select>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Categories *</label>
            <Select
              options={categories}
              value={selectedCategories}
              onChange={setSelectedCategories}
              isMulti
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              components={{ Option }}
              styles={selectStyles}
              placeholder="Select categories"
            />
          </div>

          {/* Current Images */}
          {currentImages.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-3">Current Images (click × to remove)</p>
              <div className="flex flex-wrap gap-3">
                {currentImages.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="current" className="w-20 h-20 object-cover rounded-xl border-2 border-green-200 shadow" />
                    <button
                      type="button"
                      onClick={() => removeCurrentImage(url)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Add More Images (optional)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleNewImages}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {newPreviews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {newPreviews.map((src, i) => (
                  <img key={i} src={src} alt="new" className="w-20 h-20 object-cover rounded-xl border-2 border-dashed border-green-400" />
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProductEditForm;