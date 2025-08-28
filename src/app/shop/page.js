'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebase'; // You'll need to create this
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { set } from 'zod';
// Importa react-hot-toast
import toast, { Toaster } from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      const q = query(
        collection(db, 'shop'),
        where("isActive", "==", true),
      );
      const querySnapshot = await getDocs(q);
      const productsData = [];

      querySnapshot.forEach((doc) => {
        console.log(doc)
        const product = { id: doc.id, ...doc.data() };
        productsData.push(product);
      });

      setProducts(productsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const filterProducts = () => {
    if (selectedCategory === 'All') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === selectedCategory));
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    let updatedCart;

    if (existingItem) {
      updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    // Sostituisci l'alert con un toast
    toast.success(`${product.name} aggiunto al carrello!`, {
      duration: 3000,
      position: 'TOP-center',
      // Stile personalizzato
      style: {
        background: '#10B981',
        color: '#fff',
        fontWeight: '500',
      },
      // Icona personalizzata
      icon: '🛒',
    });
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="h-100% bg-background text-foreground">
      {/* Header */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Category Filter */}

        <div className="flex justify-between items-center h-16">
          <h1 className="text-3xl font-bold mb-8">Shop</h1>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-400">
              No products found in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="border border-white/[.145] rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="aspect-square relative bg-gray-800">
                  {product.imgUrl ? (
                    <Image
                      src={product.imgUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">
                      €{product.price?.toFixed(2) || '0.00'}
                    </span>
                    {product.availableStock && product.availableStock > 0 ? (
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium hover:bg-[#ccc] transition-colors"
                      >
                        Aggiungi al Carrello
                      </button>
                    ) : (
                      <span className="text-red-500 text-sm font-medium">
                        Non più disponibile
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Componente Toaster per mostrare i toast */}
      <Toaster />
    </div>
  );
}