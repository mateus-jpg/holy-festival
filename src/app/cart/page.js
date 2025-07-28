'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppConfig } from '@/app/lib/config';
import { Aoboshi_One } from 'next/font/google';
import App from 'next/app';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setLoading(false);
  };

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    updateCart(updatedCart);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    updateCart(updatedCart);
  };
  const getSubtotalAll = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Total of only "withFee" items
  const getSubtotalWithFees = () => {
    return cart
      .filter(item => "withFee" in item && item.withFee)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Tax is always applied to all items
  const getTax = () => {
    return getSubtotalAll() * AppConfig.TAX_RATE;
  };

  // Fees are applied only on "withFee" items + their share of tax
  const getFees = () => {
    const withFeesSubtotal = getSubtotalWithFees();
    const allSubtotal = getSubtotalAll();

    if (withFeesSubtotal === 0 || allSubtotal === 0) return 0;

    // Proportional tax on withFee items
    const taxShare = (withFeesSubtotal / allSubtotal) * getTax();
    const feeBase = withFeesSubtotal + taxShare;

    return (feeBase * AppConfig.TRANSACTION_RATE) + AppConfig.TRANSACTION_FEE;
  };

  // Final total
  const getTotal = () => {
    const subtotal = getSubtotalAll();
    const tax = getTax();
    const fees = getFees();

    return subtotal + tax + fees;
  };
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    router.push('/checkout');
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
      <header className="border-b border-black/[.08] dark:border-white/[.145]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-semibold">
              Store
            </Link>
            <Link
              href="/shop"
              className="text-sm hover:underline hover:underline-offset-4"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Your cart is empty
            </p>
            <Link
              href="/shop"
              className="bg-foreground text-background px-6 py-3 rounded-full hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="border border-black/[.08] dark:border-white/[.145] rounded-lg p-4 flex items-center gap-4"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 relative bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ${item.price?.toFixed(2) || '0.00'} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    {/* Item Total & Remove */}
                    <div className="text-right">
                      <p className="font-semibold">
                        ${((item.price || 0) * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 text-sm hover:underline mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-black/[.08] dark:border-white/[.145] rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${getSubtotalAll().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                   <span>${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fees</span>
                    <span>${getFees().toFixed(2)}</span>
                  </div>
                  <div className="border-t border-black/[.08] dark:border-white/[.145] pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${getTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-foreground text-background py-3 rounded-full font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/shop"
                  className="block text-center text-sm hover:underline hover:underline-offset-4 mt-4"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}