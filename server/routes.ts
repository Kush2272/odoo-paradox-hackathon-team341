import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertCartItemSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search } = req.query;
      
      let products;
      if (category) {
        const categoryObj = await storage.getCategoryBySlug(category as string);
        if (categoryObj) {
          products = await storage.getProductsByCategory(categoryObj.id);
        } else {
          products = [];
        }
      } else if (search) {
        products = await storage.searchProducts(search as string);
      } else {
        products = await storage.getProducts();
      }
      
      // Enhance products with category info
      const productsWithCategory = await Promise.all(
        products.map(async (product) => {
          const category = await storage.getCategories().then(
            categories => categories.find(c => c.id === product.categoryId)
          );
          return { ...product, category };
        })
      );
      
      res.json(productsWithCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const category = await storage.getCategories().then(
        categories => categories.find(c => c.id === product.categoryId)
      );
      
      const seller = await storage.getUser(product.sellerId);
      
      res.json({
        ...product,
        category,
        seller: seller ? { id: seller.id, username: seller.username } : undefined
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product details" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to create a product" });
      }
      
      const productData = insertProductSchema.parse({
        ...req.body,
        sellerId: req.user.id
      });
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update a product" });
      }
      
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.sellerId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own products" });
      }
      
      const productData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(productId, productData);
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to delete a product" });
      }
      
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.sellerId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own products" });
      }
      
      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // User products (listings)
  app.get("/api/user/products", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view your products" });
      }
      
      const products = await storage.getProductsBySeller(req.user.id);
      
      // Enhance products with category info
      const productsWithCategory = await Promise.all(
        products.map(async (product) => {
          const category = await storage.getCategories().then(
            categories => categories.find(c => c.id === product.categoryId)
          );
          return { ...product, category };
        })
      );
      
      res.json(productsWithCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user products" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view your cart" });
      }
      
      const cartItems = await storage.getCartItemsWithProductDetails(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to add items to cart" });
      }
      
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if product exists
      const product = await storage.getProductById(cartItemData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update cart" });
      }
      
      const cartItemId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be a positive number" });
      }
      
      const updatedItem = await storage.updateCartItemQuantity(cartItemId, quantity);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to remove items from cart" });
      }
      
      const cartItemId = parseInt(req.params.id);
      await storage.removeFromCart(cartItemId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to clear cart" });
      }
      
      await storage.clearCart(req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to create an order" });
      }
      
      // Get cart items
      const cartItems = await storage.getCartItemsWithProductDetails(req.user.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 
        0
      );
      
      // Create order
      const orderData: z.infer<typeof insertOrderSchema> = {
        userId: req.user.id,
        totalAmount,
        status: "completed" // simplified for MVP
      };
      
      // Prepare order items
      const orderItemsData: z.infer<typeof insertOrderItemSchema>[] = cartItems.map(item => ({
        orderId: 0, // This will be replaced with the actual order ID
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price
      }));
      
      // Create order with items
      const order = await storage.createOrder(orderData, orderItemsData);
      
      // Clear cart
      await storage.clearCart(req.user.id);
      
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view your orders" });
      }
      
      const orders = await storage.getOrdersByUser(req.user.id);
      
      // Enhance orders with items
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderDetails(order.id);
          
          // Get product details for each item
          const itemsWithProduct = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProductById(item.productId);
              return { ...item, product };
            })
          );
          
          return { ...order, items: itemsWithProduct };
        })
      );
      
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update user profile
  app.put("/api/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update your profile" });
      }
      
      // Exclude password field for profile updates
      const { password, ...userData } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
