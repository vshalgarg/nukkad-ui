import React, { useState, useEffect, useRef } from 'react';
import ProductService from '../../services/ProductService';
import CategoryService from '../../services/CategoryService';
import ProductForm from './ProductForm';
import { deleteImagesFromFirebase } from '../../firebase/FirebaseService';
import { toast } from 'react-toastify';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ProductEditForm from './ProductEditForm';

const ProductsTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [paginationRange, setPaginationRange] = useState([]);
  const jsonFileInputRef = useRef(null);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [excelLoading, setExcelLoading] = useState(false);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [bulkCreateLoading, setBulkCreateLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    id: null,
    name: '',
    imageUrls: []
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchPage, setSearchPage] = useState(0);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const pageSize = 10;

 const getSearchPaginationRange = () => {
    if (searchTotalPages <= 1) return [];

    const currentPage = searchPage;
    const totalPages = searchTotalPages;
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

  const displayData = isSearchMode ? searchResults : products;
  const currentPage = isSearchMode ? searchPage : page;
  const currentTotalPages = isSearchMode ? searchTotalPages : totalPages;
  const currentPaginationRange = isSearchMode ? getSearchPaginationRange() : paginationRange;

  const fetchProducts = async (pageNum = 0) => {
    setLoading(true);
    setError('');
    try {
      const data = await ProductService.getAllProducts(pageNum, pageSize);
      setProducts(data.content);
      setTotalPages(data.totalPages);
      setPage(data.number);
      setPaginationRange(getPaginationRange(pageNum, data.totalPages));
    } catch (err) {
      const errorMsg = err.message || 'Failed to load products';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (pageNum = 0) => {
    if (!searchKeyword.trim()) {
      toast.warning("Please enter a search keyword");
      return;
    }

    setIsSearching(true);
    setError('');
    try {
      const response = await CategoryService.search(searchKeyword, pageNum, pageSize);

      if (response && response.items && response.items.length > 0) {
        const transformedProducts = response.items.map(item => ({
          id: item.id,
          name: item.name,
          unit: item.unit || [],
          categoryIds: item.categoryIds || [],
          imageUrls: item.imageUrls || []
        }));

        setSearchResults(transformedProducts);
        setSearchPage(pageNum);
        setIsSearchMode(true);

        if (response.totalPages !== undefined) {
          setSearchTotalPages(response.totalPages);
        } else {
          setSearchTotalPages(Math.ceil(response.items.length / pageSize));
        }
      } else {
        setSearchResults([]);
        setIsSearchMode(true);
        setSearchTotalPages(1);
        toast.info("No products found matching your search");
      }
    } catch (err) {
      const errorMsg = err.message || 'Search failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchPage(0);
    fetchProducts(0);
  };

  const goToNextSearchPage = () => {
    if (searchPage < searchTotalPages - 1) {
      handleSearch(searchPage + 1);
    }
  };

  const goToPreviousSearchPage = () => {
    if (searchPage > 0) {
      handleSearch(searchPage - 1);
    }
  };

  const goToNextPage = () => {
    if (page < totalPages - 1) fetchProducts(page + 1);
  };

  const goToPreviousPage = () => {
    if (page > 0) fetchProducts(page - 1);
  };

  const deleteProduct = async (product) => {

    setDeleteConfirm({
      open: true,
      id: product.id,
      name: product.name,
      imageUrls: product.imageUrls || []
    });
  };

  const confirmProductDelete = async () => {
    const { id, imageUrls, name } = deleteConfirm;

    setDeleteLoading(prev => ({ ...prev, [id]: true }));

    try {
      if (imageUrls && imageUrls.length > 0) {
        await deleteImagesFromFirebase(imageUrls);
      }
      await ProductService.deleteProduct(id);
      toast.success(`Product "${name}" deleted!`);

      if (isSearchMode) {
        handleSearch(searchPage);
      } else {
        fetchProducts(page);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [id]: false }));
      setDeleteConfirm({ open: false, id: null, name: '', imageUrls: [] });
    }
  };

  const addProducts = async (bulkProductData) => {
  setBulkCreateLoading(true);
  try {
    await ProductService.bulkCreateProducts(bulkProductData.items);

    toast.success("Products added successfully!");

    if (isSearchMode) {
      handleSearch(searchPage);
    } else {
      fetchProducts(0);
    }
    setShowForm(false);

  } catch (err) {
    toast.error(err.message || "Failed to add products");
  } finally {
    setBulkCreateLoading(false);
  }
};

 const handleExcelUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  setExcelLoading(true);
  try {
    await ProductService.uploadExcel(file);
    
    toast.success('Excel imported successfully!');
    
    if (isSearchMode) {
      handleSearch(searchPage);
    } else {
      fetchProducts(0);
    }
  } catch (err) {
    const message = err.message || 'Excel import failed';
    toast.error(message);

    console.error("Excel upload error:", err);
  } finally {
    setExcelLoading(false);
    event.target.value = null;
  }
};

  const handleJsonUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setJsonLoading(true);
    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          if (!jsonData.categories || !Array.isArray(jsonData.categories)) {
            throw new Error('Invalid JSON format');
          }
          const result = await ProductService.importProductsWithCategories(jsonData);
          toast.success(result.message || 'JSON imported!');

          if (isSearchMode) {
            handleSearch(searchPage);
          } else {
            fetchProducts(0);
          }
        } catch (parseError) {
          toast.error('Invalid JSON: ' + parseError.message);
        }
      };
      fileReader.readAsText(file);
    } catch (err) {
      toast.error(err.message || 'JSON import failed');
    } finally {
      setJsonLoading(false);
      event.target.value = null;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="ml-64 pt-20 px-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-3xl shadow-2xl border border-green-200 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Products</h1>
                <p className="text-green-100 text-base">Manage your products</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  disabled={bulkCreateLoading}
                  className="bg-white text-green-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-green-50 transition shadow-md flex items-center gap-2"
                >
                  {bulkCreateLoading ? 'Creating...' : '+ Add'}
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={excelLoading}
                  className="bg-white text-green-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-green-50 transition shadow-md flex items-center gap-2"
                >
                  {excelLoading ? 'Importing...' : 'Excel'}
                </button>
                <button
                  onClick={() => jsonFileInputRef.current.click()}
                  disabled={jsonLoading}
                  className="bg-white text-green-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-green-50 transition shadow-md flex items-center gap-2"
                >
                  {jsonLoading ? 'Importing...' : 'JSON'}
                </button>
              </div>
            </div>

            {/* Hidden Inputs */}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleExcelUpload} />
            <input ref={jsonFileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonUpload} />
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full max-w-md">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name ..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(0)}
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
                  onClick={() => handleSearch(0)}
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
                  Showing {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
                  {searchKeyword && ` for "${searchKeyword}"`}
                </p>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="max-h-[65vh] overflow-y-auto">
            {loading || isSearching ? (
              <div className="p-20 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">
                  {isSearching ? 'Searching...' : 'Loading products...'}
                </p>
              </div>
            ) : displayData.length === 0 ? (
              <div className="p-20 text-center text-gray-600">
                <p className="text-2xl font-bold">
                  {isSearchMode ? 'No products found' : 'No products yet'}
                </p>
                <p className="mt-2">
                  {isSearchMode
                    ? 'Try a different search keyword'
                    : 'Click "+ Add" to create your first product'}
                </p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-green-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">Unit</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">Categories</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">Images</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase text-green-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayData.map((product) => (
                      <tr key={product.id} className="hover:bg-green-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-800">{product.id}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {Array.isArray(product.unit) ? product.unit.join(', ') : product.unit}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{product.categoryIds?.join(', ')}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {(product.imageUrls || []).slice(0, 3).map((url, i) => (
                              <img key={i} src={url} alt="" className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow" />
                            ))}
                            {product.imageUrls?.length > 3 && (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600">
                                +{product.imageUrls.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {/* Edit Button */}
                            <button
                              onClick={() => { setEditingProduct(product); setShowEditModal(true); }}
                              className="p-2.5 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-200"
                              title="Edit Product"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  open: true,
                                  id: product.id,
                                  name: product.name,
                                  imageUrls: product.imageUrls || []
                                })
                              }
                              disabled={deleteLoading[product.id]}
                              className="p-2.5 text-red-600 rounded-xl hover:bg-red-200 transition"
                              title="Delete Product"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Compact Pagination */}
                {displayData.length > 0 && (
                  <div className="flex justify-center items-center gap-2 py-4 bg-white border-t border-gray-200">
                    <button
                      onClick={isSearchMode ? goToPreviousSearchPage : goToPreviousPage}
                      disabled={isSearchMode ? searchPage === 0 : page === 0}
                      className="px-4 py-2 text-xs rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition"
                    >
                      Prev
                    </button>
                    {currentPaginationRange.map((p, i) =>
                      p === '...' ? (
                        <span key={i} className="px-2 text-gray-500">...</span>
                      ) : (
                        <button
                          key={i}
                          onClick={() => isSearchMode ? handleSearch(p) : fetchProducts(p)}
                          className={`px-3 py-2 text-xs rounded transition ${currentPage === p
                            ? 'bg-green-600 text-white font-bold'
                            : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                          {p + 1}
                        </button>
                      )
                    )}
                    <button
                      onClick={isSearchMode ? goToNextSearchPage : goToNextPage}
                      disabled={isSearchMode ? searchPage + 1 === searchTotalPages : page + 1 === totalPages}
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

      <ProductForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={addProducts}
        loading={bulkCreateLoading}
      />
      {showEditModal && (
        <ProductEditForm
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          onSuccess={() => {
            if (isSearchMode) {
              handleSearch(searchPage);
            } else {
              fetchProducts(page);
            }
            setShowEditModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal for Products */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-200">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Product?</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.name}"</span>?
                <br />
                <span className="text-sm text-red-600">This action cannot be undone.</span>
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null, name: '', imageUrls: [] })}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmProductDelete}
                disabled={deleteLoading[deleteConfirm.id]}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-70 flex items-center gap-2"
              >
                {deleteLoading[deleteConfirm.id] ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;