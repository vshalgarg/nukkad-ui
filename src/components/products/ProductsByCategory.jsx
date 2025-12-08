import React, { useState, useEffect } from 'react';
import CategoryService from '../../services/categoryService';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const ProductsByCategory = ({ categoryId, onBack }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchCategoryAndProducts(0);
  }, [categoryId]);

  const fetchCategoryAndProducts = async (pageNum = 0) => {
    setLoading(true);
    try {
      const categoryData = await CategoryService.getCategoryById(categoryId);
      setCategory(categoryData);

      const response = await CategoryService.getProductsByCategory(categoryId, pageNum);
      setProducts(response.items || []);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || response.items?.length || 0);
      setCurrentPage(response.number || pageNum);
    } catch (err) {
      toast.error("Failed to load products");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) items.push(i);
    } else {
      items.push(0);

      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);

      if (currentPage <= 2) end = Math.min(totalPages - 2, 3);
      if (currentPage >= totalPages - 3) start = Math.max(1, totalPages - 4);

      if (start > 1) items.push('...');
      for (let i = start; i <= end; i++) items.push(i);
      if (end < totalPages - 2) items.push('...');

      items.push(totalPages - 1);
    }

    return items;
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 0 && pageNum < totalPages && pageNum !== currentPage) {
      fetchCategoryAndProducts(pageNum);
    }
  };

  const goToNextPage = () => currentPage < totalPages - 1 && fetchCategoryAndProducts(currentPage + 1);
  const goToPreviousPage = () => currentPage > 0 && fetchCategoryAndProducts(currentPage - 1);

  return (
    <div className="ml-64 pt-20 px-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-green-200 overflow-hidden">

          {/* HEADER */}
          <div className="bg-[#00ba59] text-white p-4 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center justify-center text-white hover:text-green-900 font-medium transition-colors p-2 hover:bg-green-100 rounded-lg border border-green-200"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold">
                  CATEGORY - {category?.name || `Category #${categoryId}`}
                </h1>
                <p className="text-green-100 text-sm mt-1">
                  {totalElements} product{totalElements !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto">

            {loading ? (
              <div className="p-16 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-green-500 border-t-transparent"></div>
                <p className="mt-3 text-gray-600 text-sm">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-16 text-center text-gray-600">
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-1">This category doesn't have any products yet.</p>
              </div>
            ) : (

              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">

                    <thead className="bg-green-50 shadow-md border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Unit
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-green-50/30 transition">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-500">ID: {product.id}</div>
                              {product.description && (
                                <div className="text-xs text-gray-500 line-clamp-1">{product.description}</div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <img
                                src={product.imageUrls?.[0] || "/placeholder.jpg"}
                                alt={product.name}
                                className="w-12 h-12 rounded-md object-cover border border-gray-200 shadow-sm"
                                onError={(e) => (e.target.src = "/placeholder.jpg")}
                              />
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              {product.unit?.[0] ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  {product.unit[0]}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              </>

            )}
          </div>

          {/* PAGINATION */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

              <div className="text-xs text-gray-600">
                Showing <span className="font-semibold">{products.length}</span> of{" "}
                <span className="font-semibold">{totalElements}</span> products
              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {generatePaginationItems().map((item, index) =>
                    item === "..." ? (
                      <span key={index} className="px-2 text-gray-400">...</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => goToPage(item)}
                        className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition ${
                          currentPage === item
                            ? "bg-green-600 text-white shadow-sm"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {item + 1}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>

              </div>

              <div className="text-xs text-gray-600">
                Page <span className="font-semibold">{currentPage + 1}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductsByCategory;
