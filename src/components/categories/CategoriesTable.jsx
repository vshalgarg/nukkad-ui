import React, { useState, useEffect } from 'react';
import CategoryService from '../../services/categoryService';
import CategoryForm from './CategoryForm';
import { deleteImagesFromFirebase } from '../../firebase/FirebaseService';
import { toast } from 'react-toastify';
import { EyeIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ProductsByCategory from '../products/ProductsByCategory';

const CategoriesTable = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [paginationRange, setPaginationRange] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState({});

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, imageUrl: null, name: '' });
  const [viewMode, setViewMode] = useState('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const pageSize = 10;
  

  const fetchCategories = async (pageNum = 0) => {
    setLoading(true);
    try {
      const data = await CategoryService.getAllCategoriesWithPagination(pageNum, pageSize);
      setCategories(data.content || data.items || data);
      setTotalPages(data.totalPages || 1);
      setPage(data.number || data.currentPage || pageNum);
      setPaginationRange(getPaginationRange(pageNum, data.totalPages || 1));
    } catch (err) {
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      toast.warning("Please enter a search keyword");
      return;
    }

    setIsSearching(true);
    try {
      const response = await CategoryService.searchCategories(searchKeyword, page);
      if (response.categories && response.categories.length > 0) {
        setSearchResults(response.categories);
        setIsSearchMode(true);
      } else {
        setSearchResults([]);
        setIsSearchMode(true);
        toast.info("No categories found matching your search");
      }
    } catch (err) {
      toast.error("Search failed");
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setIsSearchMode(false);
    setSearchResults([]);
    fetchCategories(0);
  };

  const displayData = isSearchMode ? searchResults : categories;

  const getPaginationRange = (currentPage, totalPages) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(0, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (range[0] > 1) {
      rangeWithDots.push(0);
      rangeWithDots.push('...');
    } else if (range[0] === 1) {
      rangeWithDots.push(0);
    }

    range.forEach(i => rangeWithDots.push(i));

    if (range[range.length - 1] < totalPages - 2) {
      rangeWithDots.push('...');
      rangeWithDots.push(totalPages - 1);
    } else if (range[range.length - 1] === totalPages - 2) {
      rangeWithDots.push(totalPages - 1);
    }

    return rangeWithDots;
  };

  const goToNextPage = () => {
    if (page < totalPages - 1) fetchCategories(page + 1);
  };

  const goToPreviousPage = () => {
    if (page > 0) fetchCategories(page - 1);
  };

  const deleteCategory = async (id, imageUrl) => {
    const category = displayData.find(cat => cat.id === id);
    setDeleteConfirm({
      open: true,
      id,
      imageUrl,
      name: category?.name || 'this category'
    });
  };

  const confirmDelete = async () => {
    const { id, imageUrl } = deleteConfirm;

    setDeleteLoading(prev => ({ ...prev, [id]: true }));
    try {
      if (imageUrl) await deleteImagesFromFirebase([imageUrl]);
      await CategoryService.deleteCategory(id);
      toast.success("Category deleted!");
      if (isSearchMode) {
        handleSearch();
      } else {
        fetchCategories(page);
      }
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setDeleteLoading(prev => ({ ...prev, [id]: false }));
      setDeleteConfirm({ open: false, id: null, imageUrl: null, name: '' });
    }
  };

  // const fetchProductsByCategory = async (categoryId, pageNum = 0) => {
  //   try {
  //     const response = await CategoryService.getProductsByCategory(categoryId, pageNum);
  //     setProducts(response.items || []);
  //     setSelectedCategory(categoryId);
  //     setShowProductsModal(true);
  //     setCurrentPage(1);
  //   } catch (err) {
  //     toast.error("Failed to load products");
  //     setProducts([]);
  //   }
  // };

  // const viewProducts = (categoryId) => {
  //   fetchProductsByCategory(categoryId, 0);
  // };

  const handleViewProducts = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setViewMode('products');
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategoryId(null);
  };


const handleCreateCategory = async (data) => {
  try {
    setLoading(true);

    await CategoryService.createCategory(data);

    toast.success("Category created successfully!");

    if (isSearchMode) {
      await handleSearch();
    } else {
      await fetchCategories(0);
    }

    setShowForm(false);
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Category already exists";
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  if (viewMode === 'categories') {
    fetchCategories();
  }
}, [viewMode]);



  if (viewMode === 'products' && selectedCategoryId) {
    return (
      <ProductsByCategory
        categoryId={selectedCategoryId}
        onBack={handleBackToCategories}
      />
    );
  }
  return (
    <div className="ml-64 pt-20 px-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      <div className="max-w-7xl mx-auto ">
        <div className="bg-white rounded-t-3xl shadow-2xl border border-green-200 overflow-hidden">

          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Categories</h1>
                <p className="text-green-100 text-base">Manage and organize your product categories</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-white text-green-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-green-50 transition shadow-md"
              >
                + Add Category
              </button>
            </div>
          </div>

          {/*Search Bar */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full max-w-md">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories by name..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-sm"
                />
                {searchKeyword && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchKeyword.trim()}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="w-5 h-5" />
                      Search
                    </>
                  )}
                </button>
                {isSearchMode && (
                  <button
                    onClick={clearSearch}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition flex items-center gap-2"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    Clear Search
                  </button>
                )}
              </div>
            </div>
            {isSearchMode && (
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  Showing {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  {searchKeyword && ` for "${searchKeyword}"`}
                </p>
              </div>
            )}
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            {loading || isSearching ? (
              <div className="p-20 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">
                  {isSearching ? 'Searching...' : 'Loading categories...'}
                </p>
              </div>
            ) : displayData.length === 0 ? (
              <div className="p-20 text-center text-gray-600">
                <p className="text-2xl font-bold">
                  {isSearchMode ? 'No categories found' : 'No categories found'}
                </p>
                <p className="mt-2">
                  {isSearchMode
                    ? 'Try a different search keyword'
                    : 'Click "Add Category" to get started!'}
                </p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-green-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">Image</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayData.map((cat) => (
                      <tr key={cat.id} className="hover:bg-green-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-800">{cat.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.name} className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600">
                                No Image
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">{cat.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-5">
                            {/* View Products */}
                            <button
                              onClick={() => handleViewProducts(cat.id)}
                              className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-all duration-200 flex items-center justify-center hover:shadow-md w-10 h-10"
                              title="View Products"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>

                            {/* Delete Category */}
                            <button
                              onClick={() => deleteCategory(cat.id, cat.imageUrl)}
                              disabled={deleteLoading[cat.id]}
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center justify-center hover:shadow-md w-10 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={deleteLoading[cat.id] ? 'Deleting...' : 'Delete Category'}
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Show pagination only when not in search mode */}
                {!isSearchMode && displayData.length > 0 && (
                  <div className="flex justify-center items-center gap-2 py-4 bg-white border-t border-gray-200">
                    <button
                      onClick={goToPreviousPage}
                      disabled={page === 0}
                      className="px-4 py-2 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition"
                    >
                      Prev
                    </button>
                    {paginationRange.map((p, i) =>
                      p === '...' ? (
                        <span key={i} className="px-2 text-gray-500">...</span>
                      ) : (
                        <button
                          key={i}
                          onClick={() => fetchCategories(p)}
                          className={`px-3 py-2 text-xs rounded transition ${page === p
                            ? 'bg-green-600 text-white font-bold'
                            : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                          {p + 1}
                        </button>
                      )
                    )}
                    <button
                      onClick={goToNextPage}
                      disabled={page + 1 === totalPages}
                      className="px-4 py-2 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CategoryForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
       onSubmit={handleCreateCategory}
       loading={loading}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-200">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Category?</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.name}"</span>?
                <br />
                <span className="text-sm text-red-600">This action cannot be undone.</span>
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null, imageUrl: null, name: '' })}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading[deleteConfirm.id]}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-70 flex items-center gap-2"
              >
                {deleteLoading[deleteConfirm.id] ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesTable;