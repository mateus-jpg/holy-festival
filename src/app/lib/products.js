import {db } from "@/app/lib/firebase"
import { doc, getDoc } from "firebase/firestore";
export function getProductPrice(productId){


    async function fetchProductPriceFromDB(productId) {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
            return productSnap.data().price;
        } else {
            throw new Error("Product not found");
        }
    }

    return fetchProductPriceFromDB(productId);
}