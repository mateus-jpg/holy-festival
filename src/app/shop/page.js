'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/app/lib/firebase';
// Importa react-hot-toast
import toast, { Toaster } from 'react-hot-toast';
import ShopFabButton from '../components/ShopFabButton';
import { eventContent } from '@/app/lib/eventContent';
import { createCartItem, readCart, writeCart } from '@/app/utils/cart';

function getAvailableStock(product) {
  const availableStock = Number(product.availableStock);
  if (product.availableStock !== null && product.availableStock !== undefined && product.availableStock !== '' && Number.isFinite(availableStock)) {
    return availableStock;
  }

  const totalStock = Number(product.totalStock);
  const soldCount = Number(product.soldCount || 0);
  if (product.totalStock !== null && product.totalStock !== undefined && product.totalStock !== '' && Number.isFinite(totalStock)) {
    return Math.max(totalStock - soldCount, 0);
  }

  return null;
}

function isProductAvailable(product) {
  const availableStock = getAvailableStock(product);
  return availableStock === null || availableStock > 0;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, products]);

  const fetchProducts = async () => {
    if (!isFirebaseConfigured || !db) {
      setLoadError('Firebase non è configurato in locale. Aggiungi le variabili NEXT_PUBLIC_FIREBASE_* per caricare i biglietti.');
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'shop'),
        where("isActive", "==", true)
        
      );
      const querySnapshot = await getDocs(q);
      const productsData = [];

      querySnapshot.forEach((doc) => {

        const product = { id: doc.id, ...doc.data() };
        const availableStock = getAvailableStock(product);
        const productWithStock = { ...product, availableStock };
        if (isProductAvailable(productWithStock)) {
            productsData.push(productWithStock);
        }
      });

      setProducts(productsData);
      setLoadError('');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoadError('Non riesco a caricare i biglietti in questo momento. Riprova tra poco.');
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
    setCart(readCart());
  };

  const addToCart = (product) => {
    const availableStock = getAvailableStock(product);
    const existingItem = cart.find(item => item.id === product.id);
    let updatedCart;

    if (existingItem) {
      if (availableStock !== null && existingItem.quantity >= availableStock) {
        toast.error('Hai raggiunto la disponibilità massima per questo biglietto.', {
          duration: 2500,
          position: 'top-center',
          style: {
            background: '#8f2f18',
            color: '#fff',
            fontWeight: '500',
          },
        });
        return;
      }

      updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      const cartItem = createCartItem(product, 1);
      if (!cartItem) {
        toast.error('Questo biglietto non può essere aggiunto al carrello.', {
          duration: 2500,
          position: 'top-center',
        });
        return;
      }

      updatedCart = [...cart, cartItem];
    }

    setCart(writeCart(updatedCart));

    // Sostituisci l'alert con un toast
    toast.success(`${product.name} aggiunto al carrello!`, {
      duration: 2000,
      position: 'top-center',
      // Stile personalizzato
      style: {
        background: '#012136',
        color: '#fff',
        fontWeight: '500',
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <ShopFabButton />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Category Filter */}

        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#c5471f]">{eventContent.shortName}</p>
          <h1 className="text-4xl font-black text-[#012136]">Spettacoli</h1>
          <p className="max-w-2xl text-[#012136]/70">
            Seleziona gli ingressi disponibili e completa l’acquisto in sicurezza.
          </p>
        </div>

        {/* Products Grid */}
        {loadError ? (
          <div className="rounded-lg border border-[#c5471f]/20 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-[#8f2f18]">
              {loadError}
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-lg border border-[#012136]/12 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-lg text-[#012136]/65">
              Nessun biglietto disponibile in questo momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-lg border border-[#012136]/12 bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-[#012136]/8">
                  {product.imgUrl ? (
                    <Image
                      src={product.imgUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#012136]/45">
                      Nessuna immagine
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-[#012136]/62 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">
                      €{product.price?.toFixed(2) || '0.00'}
                    </span>
                    {isProductAvailable(product) ? (
                      <button
                        onClick={() => addToCart(product)}
                        className="rounded-full bg-[#c5471f] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#8f2f18]"
                      >
                        Aggiungi
                      </button>
                    ) : (
                      <span className="text-sm font-bold text-[#8f2f18]">
                        Non disponibile
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
