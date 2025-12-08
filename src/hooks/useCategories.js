import { useState, useEffect } from 'react';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Load categories from localStorage on component mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  // Save categories to localStorage whenever categories change
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = (categoryData) => {
    if (isAdding) return; // Prevent multiple simultaneous additions
    
    setIsAdding(true);
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      let imageUrl;
      
      // Check if we have a direct image URL (for dummy data)
      if (categoryData.image) {
        imageUrl = categoryData.image;
      } else if (categoryData.file && categoryData.file instanceof Blob) {
        // For real file uploads, create object URL
        imageUrl = URL.createObjectURL(categoryData.file);
      } else {
        // Fallback to a default image
        imageUrl = "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop";
      }

      const newCategory = {
        id: Date.now() + Math.floor(Math.random() * 1000), // More unique ID
        name: categoryData.name,
        image: imageUrl,
        createdAt: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      };
      
      setCategories(prev => {
        // Check if category with same name already exists to prevent duplicates
        const exists = prev.some(cat => cat.name === newCategory.name);
        if (exists) {
          console.log('Category already exists:', newCategory.name);
          return prev;
        }
        return [newCategory, ...prev];
      });
      
      setLoading(false);
      setIsAdding(false);
    }, 50); // Very short delay
  };

  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const updateCategory = (id, updatedData) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === id ? { ...cat, ...updatedData } : cat
      )
    );
  };

  return {
    categories,
    loading,
    addCategory,
    deleteCategory,
    updateCategory
  };
};