"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
export default function ShopFabButton() {
    const router = useRouter();
    const [numberOfItems, setNumberOfItems] = useState(0);

    useEffect(() => {
        loadCartCount();

        const handleStorage = () => loadCartCount();
        window.addEventListener('storage', handleStorage);
        window.addEventListener('cart-updated', handleStorage);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('cart-updated', handleStorage);
        };
    }, []);

    const onClick = () => {
        router.push('/cart');
    };

    const loadCartCount = () => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            const itemCount = parsedCart.reduce((total, item) => total + (item.quantity || 1), 0);
            setNumberOfItems(itemCount);
        } else {
            setNumberOfItems(0);
        }
    };

    return (
        <div>
        <button className="fixed bottom-8 right-8 z-20 rounded-full border border-white/25 bg-[#012136] p-4 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#c5471f] focus:ring-offset-2 md:hidden" onClick={onClick} aria-label="Vai al carrello">
            <div className="absolute -right-2 -top-2 min-w-6 rounded-full bg-[#c5471f] px-1.5 py-0.5 text-center text-xs font-bold text-white">{numberOfItems}</div>
              <ShoppingCart className="w-8 h-8" />
        </button>
        </div>
    );
}
