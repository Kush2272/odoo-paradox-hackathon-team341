import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Loader2, ArrowLeft, Star, StarHalf, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ProductWithDetails } from "@shared/schema";

export default function ProductPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location] = useLocation();
  const productId = location.split("/").pop();
  const [quantity, setQuantity] = useState(1);
  
  // Fetch product details
  const { data: product, isLoading, error } = useQuery<ProductWithDetails>({
    queryKey: [`/api/products/${productId}`],
  });
  
  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to add items to cart");
      
      return apiRequest("POST", "/api/cart", {
        productId: Number(productId),
        quantity: quantity
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: `${product?.title} has been added to your cart.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add to cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle add to cart
  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-[#4CAF50]" />
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/browse">
            <Button className="bg-[#4CAF50] hover:bg-[#388E3C]">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/browse">
          <a className="inline-flex items-center text-[#4CAF50] hover:text-[#388E3C]">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Browse
          </a>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Product Image */}
          <div className="md:w-1/2">
            <div className="aspect-square">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Product Details */}
          <div className="md:w-1/2 p-6">
            <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
            
            <div className="flex items-center mb-4">
              <Badge variant="outline" className="mr-2">
                {product.category?.name || "Uncategorized"}
              </Badge>
              <div className="flex text-yellow-400">
                <Star className="fill-current h-5 w-5" />
                <Star className="fill-current h-5 w-5" />
                <Star className="fill-current h-5 w-5" />
                <Star className="fill-current h-5 w-5" />
                <StarHalf className="fill-current h-5 w-5" />
                <span className="ml-1 text-gray-600 text-sm">(4.5)</span>
              </div>
            </div>
            
            <div className="text-2xl font-bold text-[#388E3C] mb-4">
              ₹{product.price}
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Description</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Seller</h2>
              <p className="text-gray-700">{product.seller?.username || "Anonymous"}</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center border rounded-md mr-4">
                  <button 
                    className="px-3 py-1 border-r"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className="px-4">{quantity}</span>
                  <button 
                    className="px-3 py-1 border-l"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
                
                <Button 
                  className="flex-1 bg-[#4CAF50] hover:bg-[#388E3C]"
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-4 w-4" />
                  )}
                  Add to Cart
                </Button>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-[#FF5722] to-[#FF9800] hover:from-[#E64A19] hover:to-[#FB8C00] text-white font-medium"
                onClick={() => {
                  handleAddToCart();
                  setTimeout(() => {
                    location.pathname = "/cart";
                  }, 300);
                }}
                disabled={addToCartMutation.isPending}
              >
                Buy Now
              </Button>
            </div>
            
            <div className="border-t pt-4 text-sm text-gray-500">
              <p className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Eco-friendly product
              </p>
              <p className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Carbon-neutral shipping
              </p>
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sustainable packaging
              </p>
            </div>
          </div>
        </div>
      </div>
      

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">You Might Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow duration-200">
              <div className="aspect-square bg-gray-100"></div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate">Similar Eco Product</h3>
                <p className="text-sm text-gray-500 mb-2">Category</p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">$XX.XX</span>
                  <Button variant="ghost" size="sm" className="text-[#4CAF50]">
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
