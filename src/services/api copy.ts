// API Service Layer for communicating with Backend
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';
import type {
  User,
  Product,
  CartItem,
  Order,
  Rental,
  Address,
  AuthResponse,
  Appointment,
  AppointmentItem,
  TimeSlot,
  RentalDetails,
  RentalCharge,
  RentalSummary,
  RentalStatusTracking,
  AppointmentPurpose,
  AppointmentItemType,
  ChargeType,
  RentalStatus,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add auth token to requests automatically
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Debug logging for all admin requests
        if (config.url?.includes('/admin/')) {
          console.log('🔧 Admin API Request:', {
            url: config.url,
            method: config.method,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            hasAuth: !!token,
            token: token ? `${token.substring(0, 20)}...` : 'none',
          });
        }

        // Debug logging for file uploads
        if (config.data instanceof FormData) {
          console.log('🔧 API Request (FormData):', {
            url: config.url,
            method: config.method,
            baseURL: config.baseURL,
            hasAuth: !!token,
          });
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle response errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Note: We don't automatically clear auth data on 401 errors anymore
        // to prevent race conditions during logout. The authStore will handle
        // clearing auth data explicitly when needed.
        if (error.response?.status === 401) {
          console.warn('⚠️ 401 Unauthorized - token may be expired');
        }

        // Debug 404 errors
        if (error.response?.status === 404) {
          console.error('❌ 404 Not Found:', {
            url: error.config?.url,
            fullURL: `${error.config?.baseURL}${error.config?.url}`,
            method: error.config?.method,
            responseData: error.response?.data,
          });
        }

        return Promise.reject(error);
      }
    );
  }

  // Helper to clear auth data
  private async clearAuthData() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  }

  // ========== Authentication ==========

//  async  signin(provider: string, email: string, password: string): Promise<AuthResponse> {
//   try {
//     const response = await this.api.post(`/auth/signin`, {
//       provider,
//       email,
//       password,
//     });

//     return response.data;
//   } catch (error: any) {
//     return { error: { message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ server' } };
//   }
// }

//  async signup(email: string, password: string): Promise<AuthResponse> {
//   try {
//     const response = await this.api.post(`/auth/signup`, {
//       email,
//       password,
//     });
//     return response.data;
//   } catch (error: any) {
//     return { error: { message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ server' } };
//   }
// }

 async register(email: string, password: string, name?: string, username?: string): Promise<AuthResponse> {
    const response = await this.api.post('/auth/register', { email, password, name, username });
    const { user, session } = response.data;

    // Save auth data
    if (session?.access_token) {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }

    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post('/auth/login', { provider: 'email', email, password });
    const { user, session } = response.data;

    // Debug: Log user data from backend
    console.log('🔐 Login response - User:', user);

    // Save auth data
    if (session?.access_token) {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      console.log('💾 Saved user data to storage:', user);
    }

    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get('/auth/me');
    return response.data.user;
  }

  async logout(): Promise<void> {
    await this.clearAuthData();
  }

  // ========== Products ==========

  async getProducts(params?: {
    category?: string;
    limit?: number;
  }): Promise<Product[]> {
    const response = await this.api.get('/products', { params });
    return response.data;
  }

  async getLateFeeByProductId(id: string): Promise<number | null> {
    const response = await this.api.get(`/products/${id}/late-fee`);
    return response.data;
  }

  async getProductById(id: number): Promise<Product> {
    const response = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    const response = await this.api.post('/products', product);
    return response.data;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const response = await this.api.put(`/products/${id}`, product);
    return response.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await this.api.delete(`/products/${id}`);
  }

  async searchProducts(params: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    isRentable?: boolean;
  }): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.isRentable !== undefined) queryParams.append('isRentable', params.isRentable.toString());

    const response = await this.api.get(`/products/search?${queryParams.toString()}`);
    return response.data;
  }

  // ========== Cart ==========
  // Note: These endpoints need to be created in backend

  async getCart(): Promise<CartItem[]> {
    try {
      const response = await this.api.get('/cart');
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist yet, return empty array
      console.warn('Cart endpoint not implemented yet');
      return [];
    }
  }

  async addToCart(item: {
    product_id: number;
    quantity: number;
    size?: string;
    color?: string;
    type?: 'buy' | 'rent';
    rental_days?: number;
  }): Promise<CartItem> {
    const response = await this.api.post('/cart/items', item);
    return response.data;
  }

  async updateCartItem(
    id: string,
    updates: Partial<CartItem>
  ): Promise<CartItem> {
    const response = await this.api.put(`/cart/items/${id}`, updates);
    return response.data;
  }

  async removeFromCart(id: string): Promise<void> {
    await this.api.delete(`/cart/items/${id}`);
  }

  async clearCart(): Promise<void> {
    await this.api.delete('/cart');
  }

  // ========== Orders ==========

  async getOrders(): Promise<Order[]> {
    const response = await this.api.get('/orders');
    return response.data.map((order: any) => this.normalizeOrder(order));
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await this.api.get(`/orders/${id}`);
    return this.normalizeOrder(response.data);
  }

  // Helper to normalize order data from backend
  private normalizeOrder(order: any): Order {
    console.log('Normalizing order:', JSON.stringify(order, null, 2));

    // Parse shipping_address if it's a JSON string
    let shippingAddress = order.shipping_address;
    if (typeof shippingAddress === 'string') {
      try {
        shippingAddress = JSON.parse(shippingAddress);
        console.log('Parsed shipping_address:', shippingAddress);
      } catch (e) {
        console.error('Failed to parse shipping_address:', e);
        shippingAddress = {};
      }
    }

    // Map order_items to items and normalize product images
    const items = (order.order_items || []).map((item: any) => {
      const product = item.product || item.products;
      const normalizedItem = {
        ...item,
        quantity: item.quantity || item.qty, // Map qty to quantity
        product: product ? {
          ...product,
          // Use first available image
          image: product.image_1 || product.images?.[0] || product.image,
        } : undefined,
      };
      console.log('Normalized item:', normalizedItem);
      return normalizedItem;
    });

    const normalizedOrder = {
      ...order,
      shipping_address: shippingAddress,
      items,
    };

    console.log('Final normalized order:', JSON.stringify(normalizedOrder, null, 2));
    return normalizedOrder;
  }

  async createOrder(orderData: {
    items: any[];
    total_amount: number;
    shipping_address: any;
    payment_method?: string;
    notes?: string;
  }): Promise<Order> {
    const response = await this.api.post('/orders', orderData);
    return response.data;
  }

  // ========== Rentals ==========
  // Note: These endpoints need to be created in backend

  async getRentals(): Promise<Rental[]> {
    try {
      const response = await this.api.get('/rentals');
      // Normalize rental data - map product images
      const rentals = (response.data || []).map((rental: any) => {
        const product = rental.product || rental.products;
        return {
          ...rental,
          product: product ? {
            ...product,
            // Use first available image
            image: product.image_1 || product.images?.[0] || product.image,
          } : undefined,
        };
      });
      return rentals;
    } catch (error) {
      console.warn('Rentals endpoint not implemented yet');
      return [];
    }
  }

  async createRental(rental: {
    product_id: number;
    start_date: string;
    end_date: string;
    total_days: number;
    total_price: number;
  }): Promise<Rental> {
    const response = await this.api.post('/rentals', rental);
    return response.data;
  }

  async createRentalFromCart(data: {
    shipping_address: string;
    payment_method: string;
  }): Promise<Rental[]> {
    const response = await this.api.post('/rentals', data);
    return response.data;
  }

  async returnRental(id: number): Promise<Rental> {
    const response = await this.api.put(`/rentals/${id}/return`);
    return response.data;
  }
async cancelRental(id: number): Promise<Rental> {
    const response = await this.api.put(`/rentals/${id}/cancel`);
    return response.data;
  }
  async getRentalById(id: string): Promise<Rental> {
    const response = await this.api.get(`/rentals/${id}`);
    return response.data;
  }

  // ========== Rental Details & Tracking ==========

  async getRentalDetails(rentalId: string): Promise<{
    rental: Rental;
    details: RentalDetails | null;
    tracking: RentalStatusTracking[];
    charges: RentalCharge[];
  }> {
    const response = await this.api.get(`/rentals/${rentalId}/details`);
    return response.data;
  }

  async updateRentalDetails(rentalId: string, details: Partial<RentalDetails>): Promise<RentalDetails> {
    const response = await this.api.put(`/rentals/${rentalId}/details`, details);
    return response.data;
  }

  async updateRentalStatus(rentalId: string, status: RentalStatus, notes?: string): Promise<Rental> {
    const response = await this.api.put(`/rentals/${rentalId}/status`, { status, notes });
    return response.data;
  }

  async getRentalTracking(rentalId: string): Promise<RentalStatusTracking[]> {
    const response = await this.api.get(`/rentals/${rentalId}/tracking`);
    return response.data;
  }

  async getRentalSummary(rentalId: string): Promise<RentalSummary> {
    const response = await this.api.get(`/rentals/${rentalId}/summary`);
    return response.data;
  }

  // ========== Rental Charges ==========

  async getRentalCharges(rentalId: string): Promise<{
    charges: RentalCharge[];
    summary: {
      subtotal: number;
      totalRefundable: number;
      totalRefunded: number;
      byType: Record<ChargeType, number>;
    };
  }> {
    const response = await this.api.get(`/rentals/${rentalId}/charges`);
    return response.data;
  }

  async addRentalCharge(rentalId: string, charge: {
    charge_type: ChargeType;
    amount: number;
    description?: string;
    is_refundable?: boolean;
  }): Promise<RentalCharge> {
    const response = await this.api.post(`/rentals/${rentalId}/charges`, charge);
    return response.data;
  }

  async refundCharge(rentalId: string, chargeId: string): Promise<RentalCharge> {
    const response = await this.api.put(`/rentals/${rentalId}/charges/${chargeId}/refund`);
    return response.data;
  }

  // ========== Appointments ==========

  async getAvailableSlots(date: string): Promise<TimeSlot[]> {
    const response = await this.api.get('/appointments/available-slots', {
      params: { date },
    });
    // Map backend response to TimeSlot format
    const slots = response.data.slots || [];
    return slots.map((slot: any) => ({
      slot_time: slot.time,
      available_count: slot.available,
    }));
  }

  async getAppointments(): Promise<Appointment[]> {
    const response = await this.api.get('/appointments');
    return response.data;
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const response = await this.api.get(`/appointments/${id}`);
    return response.data;
  }

  async createAppointment(data: {
    appointment_date: string;
    appointment_time: string;
    purpose: AppointmentPurpose;
    notes?: string;
    rental_id?: string;
    items?: Array<{
      product_id: string;
      item_type: AppointmentItemType;
    }>;
  }): Promise<Appointment> {
    const response = await this.api.post('/appointments', data);
    return response.data;
  }

  async updateAppointment(id: string, data: {
    appointment_date?: string;
    appointment_time?: string;
    purpose?: AppointmentPurpose;
    notes?: string;
    status?: string;
  }): Promise<Appointment> {
    const response = await this.api.put(`/appointments/${id}`, data);
    return response.data;
  }

  async cancelAppointment(id: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/appointments/${id}`);
    return response.data;
  }

  // ========== Appointment Items ==========

  async addAppointmentItem(appointmentId: string, item: {
    product_id: string;
    item_type: AppointmentItemType;
    notes?: string;
  }): Promise<AppointmentItem> {
    const response = await this.api.post(`/appointments/${appointmentId}/items`, item);
    return response.data;
  }

  async updateAppointmentItem(appointmentId: string, itemId: string, data: {
    selected?: boolean;
    tried_on?: boolean;
    notes?: string;
  }): Promise<AppointmentItem> {
    const response = await this.api.put(`/appointments/${appointmentId}/items/${itemId}`, data);
    return response.data;
  }

  async removeAppointmentItem(appointmentId: string, itemId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/appointments/${appointmentId}/items/${itemId}`);
    return response.data;
  }

  // ========== Admin Appointments ==========

  async getAdminAppointments(params?: {
    date?: string;
    status?: string;
  }): Promise<Appointment[]> {
    const response = await this.api.get('/appointments/admin/all', { params });
    return response.data;
  }

  async getTodayAppointments(): Promise<Appointment[]> {
    const response = await this.api.get('/appointments/admin/today');
    return response.data;
  }

  async createAdminAppointment(data: {
    user_id: string;
    appointment_date: string;
    appointment_time: string;
    purpose: AppointmentPurpose;
    notes?: string;
  }): Promise<Appointment> {
    const response = await this.api.post('/appointments/admin/create', data);
    return response.data;
  }

  // ========== Users (Admin) ==========

  async getUsers(): Promise<Array<{ id: string; name: string; email: string; phone?: string }>> {
    const response = await this.api.get('/admin/users');
    return response.data;
  }

  // ========== Favorites ==========
  // Note: These endpoints need to be created in backend

  async getFavorites(): Promise<Product[]> {
    try {
      const response = await this.api.get('/favorites');
      // Normalize product data - map images
      const favorites = (response.data || []).map((item: any) => {
        const product = item.product || item;
        return {
          ...product,
          // Use first available image
          image: product.image_1 || product.images?.[0] || product.image,
        };
      });
      return favorites;
    } catch (error) {
      console.warn('Favorites endpoint not implemented yet');
      return [];
    }
  }

  async addToFavorites(productId: number): Promise<void> {
    await this.api.post(`/favorites/${productId}`);
  }

  async removeFromFavorites(productId: number): Promise<void> {
    await this.api.delete(`/favorites/${productId}`);
  }

  // ========== Invoice ==========

  async generateInvoice(params: {
    customer: { name: string; email: string };
    items: any[];
    total: number;
  }): Promise<{ file: string }> {
    const response = await this.api.post('/invoices', params);
    return response.data;
  }

  // ========== Geography ==========

  async getProvinces(): Promise<Array<{ id: number; code: number; name_th: string; name_en: string }>> {
    const response = await this.api.get('/geo/provinces');
    // Map API response to expected format
    return response.data.map((item: any) => ({
      id: item.id,
      code: item.provinceCode,
      name_th: item.provinceNameTh,
      name_en: item.provinceNameEn,
    }));
  }

  async getDistricts(provinceCode: number): Promise<Array<{ id: number; code: number; name_th: string; name_en: string; province_code: number }>> {
    const response = await this.api.get(`/geo/districts/${provinceCode}`);
    // Map API response to expected format
    return response.data.map((item: any) => ({
      id: item.id,
      code: item.districtCode,
      name_th: item.districtNameTh,
      name_en: item.districtNameEn,
      province_code: item.provinceCode,
    }));
  }

  async getSubdistricts(districtCode: number): Promise<Array<{ id: number; code: number; name_th: string; name_en: string; district_code: number; zip_code: string }>> {
    const response = await this.api.get(`/geo/subdistricts/${districtCode}`);
    // Map API response to expected format
    return response.data.map((item: any) => ({
      id: item.id,
      code: item.subdistrictCode,
      name_th: item.subdistrictNameTh,
      name_en: item.subdistrictNameEn,
      district_code: item.districtCode,
      zip_code: item.postalCode,
    }));
  }

  // ========== Address Books ==========

  async getAddresses(): Promise<Address[]> {
    const response = await this.api.get('/addressbooks');
    return response.data;
  }

  async getAddressById(id: string): Promise<Address> {
    const response = await this.api.get(`/addressbooks/${id}`);
    return response.data;
  }

  async getDefaultShippingAddress(): Promise<Address | null> {
    const response = await this.api.get('/addressbooks/default/shipping');
    return response.data;
  }

  async getDefaultBillingAddress(): Promise<Address | null> {
    const response = await this.api.get('/addressbooks/default/billing');
    return response.data;
  }

  async createAddress(address: {
    label: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    subdistrict: string;
    district: string;
    province: string;
    postal_code: string;
    is_default_shipping?: boolean;
    is_default_billing?: boolean;
  }): Promise<Address> {
    const response = await this.api.post('/addressbooks', address);
    return response.data;
  }

  async updateAddress(id: string, address: Partial<{
    label: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2: string;
    subdistrict: string;
    district: string;
    province: string;
    postal_code: string;
    is_default_shipping: boolean;
    is_default_billing: boolean;
  }>): Promise<Address> {
    const response = await this.api.put(`/addressbooks/${id}`, address);
    return response.data;
  }

  async deleteAddress(id: string): Promise<void> {
    await this.api.delete(`/addressbooks/${id}`);
  }

  async setDefaultShipping(id: string): Promise<Address> {
    const response = await this.api.put(`/addressbooks/${id}/default/shipping`);
    return response.data;
  }

  async setDefaultBilling(id: string): Promise<Address> {
    const response = await this.api.put(`/addressbooks/${id}/default/billing`);
    return response.data;
  }

  // ==================== Admin APIs ====================

  /**
   * Get dashboard statistics (admin only)
   */
  async getAdminDashboardStats(): Promise<{
    totalProducts: number;
    totalOrders: number;
    totalRentals: number;
    totalUsers: number;
    totalRevenue: number;
  }> {
    const response = await this.api.get('/admin/dashboard/stats');
    return response.data;
  }

  /**
   * Get all products for admin management (admin only)
   */
  async getAdminProducts(): Promise<Product[]> {
    const response = await this.api.get('/admin/products');
    return response.data;
  }

  /**
   * Get product by ID for admin (admin only)
   */
  async getAdminProduct(id: string): Promise<Product> {
    const response = await this.api.get(`/admin/products/${id}`);
    return response.data;
  }

  /**
   * Create new product (admin only)
   */
  async createAdminProduct(productData: {
    name: string;
    description?: string;
    price: number;
    category: string;
    stock_quantity?: number;
    sizes?: string[];
    colors?: string[];
    is_rentable?: boolean;
    rent_price_per_day?: number;
    image_1?: string;
    image_2?: string;
    image_3?: string;
    image_4?: string;
    image_5?: string;
    images?: string[];
  }): Promise<Product> {
    const response = await this.api.post('/admin/products', productData);
    return response.data;
  }

  /**
   * Update product (admin only)
   */
  async updateAdminProduct(
    id: string,
    productData: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      stock_quantity: number;
      sizes: string[];
      colors: string[];
      is_rentable: boolean;
      rent_price_per_day: number;
      late_fee: number;
      image_1: string;
      image_2: string;
      image_3: string;
      image_4: string;
      image_5: string;
      images: string[];
    }>
  ): Promise<Product> {
    const response = await this.api.put(`/admin/products/${id}`, productData);
    return response.data;
  }

  /**
   * Delete product (admin only)
   */
  async deleteAdminProduct(id: string): Promise<void> {
    await this.api.delete(`/admin/products/${id}`);
  }

  /**
   * Upload image to Supabase Storage (admin only)
   */
  async uploadImage(formData: FormData): Promise<{ file: { path: string; publicUrl: string } }> {
    const response = await this.api.post('/buckets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Save push notification token
   */
  async savePushToken(token: string): Promise<void> {
    await this.api.post('/push-token', { token });
  }

  /**
   * Remove push notification token
   */
  async removePushToken(token: string): Promise<void> {
    await this.api.delete('/push-token', { data: { token } });
  }

  /**
   * Get all orders for admin (admin only)
   */
  async getAdminOrders(): Promise<Order[]> {
    const response = await this.api.get('/admin/orders');
    return response.data;
  }

  /**
   * Get single order by ID (admin view with all details)
   */
  async getAdminOrderById(id: string): Promise<Order> {
    const response = await this.api.get(`/admin/orders/${id}`);
    return this.normalizeOrder(response.data);
  }

  /**
   * Get all rentals for admin (admin only)
   */
  async getAdminRentals(): Promise<Rental[]> {
    const response = await this.api.get('/admin/rentals');
    return response.data;
  }

  /**
   * Get all users for admin (admin only)
   */
  async getAdminUsers(): Promise<User[]> {
    const response = await this.api.get('/admin/users');
    return response.data;
  }

  /**
   * Invoice APIs
   */

  /**
   * Get invoice by order ID
   */
  async getInvoiceByOrderId(orderId: string): Promise<any> {
    const response = await this.api.get(`/invoices/order/${orderId}`);
    return response.data;
  }

  /**
   * Generate invoice for an order (admin/staff)
   */
  async generateInvoicOrder(orderId: string): Promise<any> {
    const response = await this.api.post(`/invoices/order/${orderId}/generate`);
    return response.data;
  }

  /**
   * Delete invoice (admin only)
   */
  async deleteInvoice(orderId: string): Promise<void> {
    await this.api.delete(`/invoices/order/${orderId}`);
  }

  /**
   * Get invoice download URL (without token - for direct browser access)
   */
  getInvoiceDownloadUrl(orderId: string): string {
    return `${API_BASE_URL}/invoices/order/${orderId}/download`;
  }

  /**
   * Generate one-time download token and get download URL
   * Token is valid for 30 seconds and can only be used once
   */
  async getInvoiceDownloadUrlWithToken(orderId: string): Promise<string> {
    const response = await this.api.post(`/invoices/order/${orderId}/download-token`);
    const { token, downloadUrl } = response.data;
    return `${API_BASE_URL}${downloadUrl}`;
  }

  /**
   * Company Settings APIs
   */

  /**
   * Get public store info (logo, name) - No authentication required
   * For frontstore/customer-facing pages
   */
  async getPublicStoreInfo(): Promise<{
    company_name: string;
    company_logo_url: string | null;
    company_phone: string;
    company_address: string;
  }> {
    const response = await this.api.get('/store-info');
    return response.data;
  }

  /**
   * Get company settings (admin/staff)
   */
  async getCompanySettings(): Promise<import('../types').CompanySettings> {
    const response = await this.api.get('/company-settings');
    return response.data;
  }

  /**
   * Update company settings (admin only)
   */
  async updateCompanySettings(settings: Partial<import('../types').CompanySettings>): Promise<import('../types').CompanySettings> {
    const response = await this.api.put('/company-settings', settings);
    return response.data;
  }

  /**
   * Upload company logo (admin only)
   * Uses same format as imageUploadService
   */
  async uploadCompanyLogo(imageAsset: any): Promise<string> {
    try {
      console.log('🔧 uploadCompanyLogo called with:', {
        uri: imageAsset.uri,
        type: imageAsset.type,
        width: imageAsset.width,
        height: imageAsset.height,
      });

      // Get file extension from URI (same as imageUploadService)
      const fileExtension = imageAsset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      // Use fixed filename - backend will always use pari_logo.{ext}
      const fileName = `pari_logo.${fileExtension}`;

      console.log('📦 Preparing FormData:', {
        fileName,
        extension: fileExtension,
        uri: imageAsset.uri,
      });

      // Create FormData - same format as imageUploadService
      const formData = new FormData();

      // React Native FormData requires this specific format
      formData.append('logo', {
        uri: imageAsset.uri,
        type: `image/${fileExtension}`,
        name: fileName,
      } as any);

      console.log('📤 Sending upload request to /company-logo...');

      // Upload with multipart/form-data
      const response = await this.api.post('/company-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Upload successful:', response.data);
      return response.data.url;
    } catch (error: any) {
      console.error('❌ Error in uploadCompanyLogo:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      throw error;
    }
  }

  /**
   * Activity Log APIs
   */

  /**
   * Get activity logs with pagination (admin/staff)
   */
  async getActivityLogs(params?: {
    page?: number;
    limit?: number;
    userId?: number;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    logs: import('../types').ActivityLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await this.api.get('/activity-logs', { params });
    return response.data;
  }

  /**
   * Get activity log by ID (admin/staff)
   */
  async getActivityLogById(id: string): Promise<import('../types').ActivityLog> {
    const response = await this.api.get(`/activity-logs/${id}`);
    return response.data;
  }

  /**
   * Get activity logs for a specific resource (admin/staff)
   */
  async getResourceActivityLogs(resourceType: string, resourceId: string, limit?: number): Promise<import('../types').ActivityLog[]> {
    const params = limit ? { limit } : {};
    const response = await this.api.get(`/activity-logs/${resourceType}/${resourceId}`, { params });
    return response.data;
  }

  /**
   * Get activity stats (admin/staff)
   */
  async getActivityStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    total: number;
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
    recentActivity: any[];
  }> {
    const response = await this.api.get('/activity-logs/stats', { params });
    return response.data;
  }
}

// Export singleton instance

export const apiService = new ApiService();
export default apiService;
