import { users, User, InsertUser, products, Product, InsertProduct, categories, Category, InsertCategory, orders, Order, InsertOrder, orderItems, OrderItem, InsertOrderItem, cartItems, CartItem, InsertCartItem } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProductsBySeller(sellerId: number): Promise<Product[]>;
  searchProducts(keyword: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  getCartItemsWithProductDetails(userId: number): Promise<any[]>;
  getCartItemByUserAndProduct(userId: number, productId: number): Promise<CartItem | undefined>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
  
  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrderDetails(orderId: number): Promise<OrderItem[]>;
  
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private cartItems: Map<number, CartItem>;
  
  sessionStore: session.SessionStore;
  
  private userId: number = 1;
  private categoryId: number = 1;
  private productId: number = 1;
  private orderId: number = 1;
  private orderItemId: number = 1;
  private cartItemId: number = 1;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.cartItems = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with default categories
    this.initializeCategories();
  }
  
  private initializeCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: "Home & Living", slug: "home-living" },
      { name: "Personal Care", slug: "personal-care" },
      { name: "Fashion", slug: "fashion" },
      { name: "Food & Kitchen", slug: "food-kitchen" }
    ];
    
    defaultCategories.forEach(category => {
      this.createCategory(category);
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const category: Category = { ...categoryData, id };
    this.categories.set(id, category);
    return category;
  }
  
  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId
    );
  }
  
  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.sellerId === sellerId
    );
  }
  
  async searchProducts(keyword: string): Promise<Product[]> {
    const lowerKeyword = keyword.toLowerCase();
    return Array.from(this.products.values()).filter(
      (product) => product.title.toLowerCase().includes(lowerKeyword) || 
                   product.description.toLowerCase().includes(lowerKeyword)
    );
  }
  
  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const now = new Date();
    const product: Product = { ...productData, id, createdAt: now };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct = { ...existingProduct, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId
    );
  }
  
  async getCartItemsWithProductDetails(userId: number): Promise<any[]> {
    const items = await this.getCartItems(userId);
    return Promise.all(items.map(async (item) => {
      const product = await this.getProductById(item.productId);
      return {
        ...item,
        product
      };
    }));
  }
  
  async getCartItemByUserAndProduct(userId: number, productId: number): Promise<CartItem | undefined> {
    return Array.from(this.cartItems.values()).find(
      (item) => item.userId === userId && item.productId === productId
    );
  }
  
  async addToCart(cartItemData: InsertCartItem): Promise<CartItem> {
    // Check if the item already exists
    const existingItem = await this.getCartItemByUserAndProduct(
      cartItemData.userId,
      cartItemData.productId
    );
    
    if (existingItem) {
      // Update quantity
      return this.updateCartItemQuantity(existingItem.id, existingItem.quantity + cartItemData.quantity) as Promise<CartItem>;
    } else {
      // Create new cart item
      const id = this.cartItemId++;
      const cartItem: CartItem = { ...cartItemData, id };
      this.cartItems.set(id, cartItem);
      return cartItem;
    }
  }
  
  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    const updatedItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async removeFromCart(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }
  
  async clearCart(userId: number): Promise<boolean> {
    const items = await this.getCartItems(userId);
    items.forEach(item => this.cartItems.delete(item.id));
    return true;
  }
  
  // Order operations
  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.orderId++;
    const now = new Date();
    const order: Order = { ...orderData, id, createdAt: now };
    this.orders.set(id, order);
    
    // Create order items
    items.forEach(item => {
      const itemId = this.orderItemId++;
      const orderItem: OrderItem = { ...item, id, orderId: order.id };
      this.orderItems.set(itemId, orderItem);
    });
    
    return order;
  }
  
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getOrderDetails(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }
}

export const storage = new MemStorage();
