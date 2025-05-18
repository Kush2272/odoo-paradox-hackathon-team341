import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Category, Product } from "@shared/schema";
import ProductCard from "@/components/product/product-card";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch trending products (limited to 4)
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Get trending products (most recent 4)
  const trendingProducts = products
    ? [...products].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 4)
    : [];

  return (
    <div className="py-8">
      {/* Hero Banner */}
      <div className="bg-[#81C784] rounded-lg overflow-hidden mb-10 mx-4">
        <div 
          className="h-64 md:h-96 bg-cover bg-center flex items-center justify-center" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1606522754091-a3bbf9ad4cb3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=800')" }}
        >
          <div className="text-center px-4 py-6 bg-white bg-opacity-80 rounded-lg">
            <h1 className="font-bold text-2xl md:text-4xl text-[#388E3C] mb-2">Sustainable Shopping Made Easy</h1>
            <p className="text-neutral-700 mb-4">Find eco-friendly products from trusted sellers</p>
            <Link href="/browse">
              <a className="px-6 py-3 rounded-lg bg-[#4CAF50] text-white hover:bg-[#388E3C] transition-colors duration-200 inline-block">
                Shop Now
              </a>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Featured Categories */}
      <div className="container mx-auto px-4 mb-12">
        <h2 className="font-semibold text-2xl mb-6">Featured Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories?.map(category => (
            <Link key={category.id} href={`/browse?category=${category.slug}`}>
              <a className="group block text-center">
                <div 
                  className="rounded-lg overflow-hidden mb-2 aspect-square bg-cover bg-center" 
                  style={{
                    backgroundImage: 
                      category.slug === "home-living" 
                        ? "url('https://images.unsplash.com/photo-1544457070-4cd773b4d71e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=500')"
                        : category.slug === "personal-care"
                          ? "url('https://pixabay.com/get/gfdfa3761dbf8a0aa5d36a7a8b05d7e656ec91edbfb62a6e3b204dacba2b0ae06ec42c54b28d42298734aaa91e97fb285830840c694b0e6e99e1014d5947aa939_1280.jpg')"
                          : category.slug === "fashion"
                            ? "url('https://images.unsplash.com/photo-1560243563-062bfc001d68?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=500')"
                            : "url('https://images.unsplash.com/photo-1584473457406-6240486418e9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=500')"
                  }}
                >
                  <div className="w-full h-full bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200"></div>
                </div>
                <h3 className="font-medium text-lg text-neutral-800">{category.name}</h3>
              </a>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Trending Products */}
      <div className="container mx-auto px-4 mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-2xl">Trending Products</h2>
          <Link href="/browse">
            <a className="text-[#4CAF50] hover:text-[#388E3C] font-medium">View All</a>
          </Link>
        </div>
        
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded mb-2 w-2/3"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      
      {/* Why EcoFinds */}
      <div className="bg-neutral-100 py-12">
        <div className="container mx-auto px-4">
          <h2 className="font-semibold text-2xl text-center mb-8">Why Choose EcoFinds?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#4CAF50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path>
                  <path d="M11 16v4"></path>
                  <path d="M13 16v4"></path>
                </svg>
              </div>
              <h3 className="font-medium text-xl mb-2">Eco-Friendly Products</h3>
              <p className="text-neutral-600">Every product meets our sustainability standards.</p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#4CAF50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="font-medium text-xl mb-2">Verified Sellers</h3>
              <p className="text-neutral-600">Shop with confidence from trusted eco-conscious sellers.</p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#4CAF50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <h3 className="font-medium text-xl mb-2">Carbon-Neutral Shipping</h3>
              <p className="text-neutral-600">We offset the carbon footprint of every delivery.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
