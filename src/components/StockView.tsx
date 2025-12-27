import { useState, useEffect } from 'react';
import { Product } from '../types';
import { stockService } from '../services/api';
import {
  Package,
  Search,
  RefreshCw,
  Tag,
  DollarSign,
  Boxes,
  Filter,
  ChevronRight,
  X,
  Edit3,
  Trash2,
  Loader2,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface StockViewProps {
  onDataChanged?: () => void;
}

export function StockView({ onDataChanged }: StockViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Load products
  const loadProducts = async () => {
    try {
      const data = await stockService.getAll();
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Handle delete product
  const handleDelete = async (product: Product) => {
    const result = await Swal.fire({
      title: 'ลบสินค้า?',
      html: `
        <div class="text-left">
          <p class="mb-2">ต้องการลบสินค้านี้หรือไม่?</p>
          <p class="text-sm text-gray-500"><strong>${product.name}</strong></p>
          <p class="text-red-600 text-sm mt-2">การลบนี้ไม่สามารถย้อนกลับได้</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (!result.isConfirmed) return;

    try {
      await stockService.delete(product.id);
      await Swal.fire({
        icon: 'success',
        title: 'ลบสินค้าสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
      loadProducts();
      setSelectedProduct(null);
      onDataChanged?.();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถลบได้',
        text: error.response?.data?.error || error.message,
      });
    }
  };

  // Handle update stock quantity
  const handleUpdateStock = async (product: Product) => {
    const { value: newQuantity } = await Swal.fire({
      title: 'แก้ไขจำนวนสินค้า',
      input: 'number',
      inputLabel: `${product.name}`,
      inputValue: product.stock_quantity,
      inputAttributes: {
        min: '0',
        step: '1',
      },
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => {
        if (!value || parseInt(value) < 0) {
          return 'กรุณาระบุจำนวนที่ถูกต้อง';
        }
        return null;
      },
    });

    if (newQuantity === undefined) return;

    try {
      await stockService.update(product.id, {
        stock_quantity: parseInt(newQuantity),
      });
      await Swal.fire({
        icon: 'success',
        title: 'อัพเดทสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
      loadProducts();
      onDataChanged?.();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถอัพเดทได้',
        text: error.response?.data?.error || error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">สินค้าคงคลัง</h2>
          <p className="text-sm text-gray-500">{products.length} รายการ</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 hover:bg-gray-100 rounded-xl transition"
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent outline-none text-sm text-gray-700"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">ยังไม่มีสินค้า</h3>
          <p className="text-gray-400">สินค้าจะปรากฏที่นี่เมื่อโอนจากงานผลิตที่เสร็จสิ้น</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                {/* Product Image or Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  {product.image_1 ? (
                    <img
                      src={product.image_1}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Package className="w-7 h-7 text-blue-600" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    {product.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {product.category}
                      </span>
                    )}
                    {product.sku && (
                      <span className="text-xs text-gray-400">SKU: {product.sku}</span>
                    )}
                  </div>
                </div>

                {/* Stock & Price */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-emerald-600 font-bold">
                    <Boxes className="w-4 h-4" />
                    {product.stock_quantity}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatPrice(product.price)}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedProduct.name}</h2>
                {selectedProduct.sku && (
                  <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Image */}
              {selectedProduct.image_1 && (
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={selectedProduct.image_1}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <Boxes className="w-5 h-5" />
                    <span className="text-sm font-medium">คงเหลือ</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {selectedProduct.stock_quantity}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">ราคา</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatPrice(selectedProduct.price)}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {selectedProduct.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">หมวดหมู่</span>
                    <span className="font-medium text-gray-800">{selectedProduct.category}</span>
                  </div>
                )}
                {selectedProduct.is_rentable !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ให้เช่าได้</span>
                    <span className={`font-medium ${selectedProduct.is_rentable ? 'text-green-600' : 'text-gray-400'}`}>
                      {selectedProduct.is_rentable ? 'ได้' : 'ไม่ได้'}
                    </span>
                  </div>
                )}
                {selectedProduct.rent_price_per_day && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ค่าเช่า/วัน</span>
                    <span className="font-medium text-gray-800">
                      {formatPrice(selectedProduct.rent_price_per_day)}
                    </span>
                  </div>
                )}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ไซส์</span>
                    <span className="font-medium text-gray-800">
                      {selectedProduct.sizes.join(', ')}
                    </span>
                  </div>
                )}
                {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">สี</span>
                    <span className="font-medium text-gray-800">
                      {selectedProduct.colors.join(', ')}
                    </span>
                  </div>
                )}
                {selectedProduct.description && (
                  <div>
                    <span className="text-gray-500 text-sm">รายละเอียด</span>
                    <p className="text-gray-800 mt-1">{selectedProduct.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-2">
              <button
                onClick={() => handleUpdateStock(selectedProduct)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition font-medium"
              >
                <Edit3 className="w-5 h-5" />
                แก้ไขจำนวน
              </button>
              <button
                onClick={() => handleDelete(selectedProduct)}
                className="w-full bg-white hover:bg-red-50 text-red-600 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition border border-red-200 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                ลบสินค้า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
