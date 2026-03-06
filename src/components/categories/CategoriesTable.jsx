import React, { useState, useEffect } from 'react';
import CategoryService from '../../services/CategoryService';
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
    <div className="px-3 pt-4 sm:px-6 lg:px-8 bg-slate-50 min-h-full w-full">

      <div className="w-full mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-96px)] overflow-hidden">

          {/* ================= HEADER ================= */}
          <div className="bg-white
 text-slate-700 border-b border-slate-200 px-6 py-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">Categories</h1>
                <p className="text-sm">
                  Manage and organize your product categories
                </p>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="bg-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition shadow-sm"
              >
                + Add Category
              </button>
            </div>
          </div>

          {/* ================= SEARCH ================= */}
          <div className="px-6 py-4 border-b bg-white shrink-0">
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlassIcon
                className="absolute left-4 top-1/2 -translate-y-1/2
                 w-5 h-5 text-gray-400 pointer-events-none"
              />

              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="Search categories..."
                className="
        w-full
        pl-12 pr-12
        py-3
        border border-gray-300
        rounded-xl
        text-sm
        focus:ring-2 focus:ring-teal-500
        focus:border-teal-500
        transition
      "
              />

              {searchKeyword && (
                <button
                  onClick={clearSearch}
                  className="
          absolute right-4 top-1/2 -translate-y-1/2
          text-gray-400 hover:text-gray-600
        "
                  title="Clear search"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}

            </div>
          </div>


          {/* ================= TABLE + SCROLL ================= */}
          <div className="flex-1 overflow-hidden">

            <div className="h-full overflow-auto">
              <table
                className="w-full border-collapse table-fixed"
                style={{ tableLayout: 'fixed' }}
              >
                <thead className="sticky top-0 bg-slate-100 z-20 border-b border-slate-200">
                  <tr>
                    <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold uppercase text-green-800">
                      ID
                    </th>

                    <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold uppercase text-green-800">
                      Image
                    </th>

                    {/* Name – Always visible */}
                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase text-green-800">
                      Name
                    </th>

                    {/* Actions – Always visible */}
                    <th className="px-2 md:px-6 py-4 text-left md:text-center text-xs font-bold uppercase text-green-800 w-[72px] md:w-auto">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {displayData.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50 transition">

                      {/* ID – Desktop only */}
                      <td className="hidden md:table-cell px-6 py-4 font-bold text-gray-800">
                        {cat.id}
                      </td>

                      {/* Image – Desktop only */}
                      <td className="hidden md:table-cell px-6 py-4">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg
                          flex items-center justify-center
                          text-xs text-gray-600">
                            No Image
                          </div>
                        )}
                      </td>

                      {/* Name – Always visible */}
                      <td className="px-3 md:px-6 py-4 font-bold text-gray-800 w-full">
                        <div className="truncate">
                          {cat.name}
                        </div>
                      </td>

                      {/* Actions – Always visible */}
                      <td className="px-2 md:px-6 py-4 w-[72px] md:w-auto">
                        <div className="flex items-center gap-2 justify-end md:justify-center">
                          <button
                            onClick={() => handleViewProducts(cat.id)}
                            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center
                       rounded-lg text-teal-600 hover:bg-teal-50
                       hover:shadow-md transition"
                            title="View Products"
                          >
                            <EyeIcon className="w-4 h-4 md:w-5 md:h-5" />
                          </button>

                          <button
                            onClick={() => deleteCategory(cat.id, cat.imageUrl)}
                            disabled={deleteLoading[cat.id]}
                            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center
                       rounded-lg text-rose-600 hover:bg-rose-50
                       hover:shadow-md transition disabled:opacity-50"
                            title="Delete Category"
                          >
                            <TrashIcon className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {/* ================= PAGINATION ================= */}
            {!isSearchMode && displayData.length > 0 && (
              <div className="border-t bg-white sticky bottom-0">
                <div className="flex justify-center items-center gap-2 py-4">
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
                          ? 'bg-teal-600 text-white font-bold'
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
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ================= FORM ================= */}
      <CategoryForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateCategory}
        loading={loading}
      />

      {/* ================= DELETE MODAL ================= */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Delete Category?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <b>"{deleteConfirm.name}"</b>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({ open: false, id: null, imageUrl: null, name: '' })
                }
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading[deleteConfirm.id]}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-70"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default CategoriesTable;