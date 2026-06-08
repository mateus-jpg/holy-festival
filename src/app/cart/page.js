'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { calculateCartTotals } from '@/app/lib/cartTotals';
import { resolveLocalImage } from '@/app/lib/localImages';
import { readCart, writeCart } from '@/app/utils/cart';
import { useAuth } from '../contexts/AuthContext';

export default function Cart() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [canCheckout, setCanCheckout] = useState(false);
    const { user } = useAuth();
    useEffect(() => {
        if (user) {
            setCanCheckout(!!(user.name && user.surname));
        } else {
            setCanCheckout(false);
        }
    }, [user]);
    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = () => {
        setCart(readCart());
        setLoading(false);
    };

    const updateCart = (updatedCart) => {
        setCart(writeCart(updatedCart));
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
    const totals = calculateCartTotals(cart);
    const handleCheckout = () => {
        if (cart.length === 0) {
            alert('Il tuo carrello è vuoto!');
            return;
        }
        router.push('/checkout');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div role="status" aria-live="polite" className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground">
                    <span className="sr-only">Caricamento carrello</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#c5471f]">GMR 2026</p>
                        <h1 className="text-4xl font-black text-[#012136]">Carrello</h1>
                    </div>
                    <Link
                        href="/shop"
                        className="rounded-full border border-[#012136]/18 bg-white px-4 py-2 text-sm font-bold text-[#012136] transition-colors hover:bg-[#012136]/8"
                    >
                        Continua gli acquisti
                    </Link>
                </div>
                {cart.length === 0 ? (
                    <div className="rounded-lg border border-[#012136]/12 bg-white px-6 py-12 text-center shadow-sm">
                        <p className="mb-4 text-lg text-[#012136]/65">
                            Il tuo carrello è vuoto
                        </p>
                        <Link
                            href="/shop"
                            className="inline-block rounded-full bg-[#012136] px-6 py-3 font-bold text-white transition-colors hover:bg-[#0a6f6a]"
                        >
                            Vai ai biglietti
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="space-y-4">
                                {cart.map((item) => {
                                    const imageSrc = resolveLocalImage(item.imgUrl);

                                    return (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 rounded-lg border border-[#012136]/12 bg-white p-4 shadow-sm"
                                    >
                                        {/* Product Image */}
                                        <div className="relative h-20 w-20 flex-shrink-0 rounded-lg bg-[#012136]/8">
                                            {imageSrc ? (
                                                <Image
                                                    src={imageSrc}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-xs text-[#012136]/45">
                                                    Nessuna Immagine
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-grow">
                                            <h3 className="font-semibold text-lg">{item.name}</h3>
                                            <p className="text-sm text-[#012136]/62">
                                                {item.price?.toFixed(2) || '0.00'}€ l'uno
                                            </p>
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                aria-label={`Diminuisci quantità di ${item.name}`}
                                                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#012136]/18 transition-colors hover:bg-[#012136]/8"
                                            >
                                                −
                                            </button>
                                            <span className="w-8 text-center" aria-live="polite" aria-label={`Quantità ${item.quantity}`}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                aria-label={`Aumenta quantità di ${item.name}`}
                                                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#012136]/18 transition-colors hover:bg-[#012136]/8"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Item Total & Remove */}
                                        <div className="md:text-right text-center">
                                            <p className="font-semibold">
                                                €{((item.price || 0) * item.quantity).toFixed(2)}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.id)}
                                                aria-label={`Rimuovi ${item.name} dal carrello`}
                                                className="mt-1 text-sm font-semibold text-[#8f2f18] hover:underline"
                                            >
                                                Rimuovi
                                            </button>
                                        </div>
                                        </div>  
                                    </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 rounded-lg border border-[#012136]/12 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold mb-4">Riepilogo Ordine</h2>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between">
                                        <span>Subtotale</span>
                                        <span>{totals.subtotal.toFixed(2)}€</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Commissioni</span>
                                        <span>{totals.fees.toFixed(2)}€</span>
                                    </div>
                                    <div className="border-t border-[#012136]/12 pt-2">
                                        <div className="flex justify-between font-semibold text-lg">
                                            <span>Totale</span>
                                            <span>{totals.total.toFixed(2)}€</span>
                                        </div>
                                    </div>
                                </div>

                                {canCheckout ? <button
                                    type="button"
                                    onClick={handleCheckout}
                                    className="w-full rounded-full bg-[#c5471f] py-3 font-bold text-white transition-colors hover:bg-[#8f2f18]"
                                >
                                    Procedi al Checkout
                                </button> : 
                                <div className="rounded-lg border border-[#c5471f]/25 bg-[#c5471f]/10 p-3 text-sm font-semibold text-[#8f2f18]">
                                    Per procedere al checkout, completa il profilo con nome e cognome.
                                </div>
                                }
                                {/* Continue Shopping Link */}

                                <Link
                                    href="/shop"
                                    className="mt-4 block text-center text-sm font-semibold text-[#012136] hover:underline hover:underline-offset-4"
                                >
                                    Continua con le prenotazioni
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
