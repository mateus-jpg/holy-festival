"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
export default function ShopFabButton() {
    const router = useRouter();
    const [cart, setCart] = useState([]);
    const [numberOfItems, setNumberOfItems] = useState(0);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setCart(parsedCart);
            const itemCount = parsedCart.reduce((total, item) => total + (item.quantity || 1), 0);
            setNumberOfItems(itemCount);
            console.log(itemCount)
        }
    }, [localStorage.getItem('cart')]);
    const onClick = () => {
        router.push('/cart');
    };

    const loadCart = () => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
            console.log(JSON.parse(savedCart))
        }
    };
    useEffect(() => {
        loadCart();
    }
    , []);
    return (
        <div>
        <button className="md:hidden z-20 fixed bottom-8 right-8 bg-black/30 backdrop-blur-lg shadow-lg border-bounded-md text-white p-4 rounded-md transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={onClick} aria-label="Go to Cart">
            <div className="absolute -top-3 -right-3 p-0 px-1.5 bg-red-500 text-white rounded-full ">{numberOfItems}</div>
              <ShoppingCart className="w-8 h-8" />
        </button>
        </div>
    );
}
