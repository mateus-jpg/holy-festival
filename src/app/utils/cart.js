export const CART_STORAGE_KEY = 'cart';
export const MAX_CART_QUANTITY = 100;

export function sanitizeCartItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const price = Number(item.price);
  const quantity = Math.min(
    MAX_CART_QUANTITY,
    Math.floor(Number(item.quantity || 1))
  );

  if (
    !item.id ||
    !item.name ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return null;
  }

  return {
    id: String(item.id),
    name: String(item.name),
    description: item.description ? String(item.description) : '',
    imgUrl: item.imgUrl || '',
    category: item.category || '',
    price,
    quantity,
    withFees: Boolean(item.withFees || item.withFee),
    availableStock: Number.isFinite(Number(item.availableStock))
      ? Number(item.availableStock)
      : null,
  };
}

export function createCartItem(product, quantity = 1) {
  return sanitizeCartItem({
    id: product.id,
    name: product.name,
    description: product.description,
    imgUrl: product.imgUrl,
    category: product.category,
    price: product.price,
    quantity,
    withFees: product.withFees || product.withFee,
    availableStock: product.availableStock,
  });
}

export function sanitizeCart(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map(sanitizeCartItem).filter(Boolean);
}

export function readCart() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    return sanitizeCart(JSON.parse(savedCart || '[]'));
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

export function writeCart(cart) {
  const sanitizedCart = sanitizeCart(cart);
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(sanitizedCart));
  window.dispatchEvent(new Event('cart-updated'));
  return sanitizedCart;
}

export function clearCart() {
  window.localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event('cart-updated'));
}

export function getCartItemCount(cart) {
  return sanitizeCart(cart).reduce((total, item) => total + item.quantity, 0);
}
