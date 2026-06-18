// Simple Shopping Cart with localStorage
const supportEmail = 'lootnexus247support@gmail.com';
const telegramLink = 'https://t.me/lootnexus_support';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Update cart count in nav
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

// Add item to cart
function addToCart(productName, price) {
    cart.push({ name: productName, price: parseFloat(price.replace('$', '')) });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(`${productName} added to cart!`);
}

// Display cart summary (redirect to cart page)
function showCart() {
    window.location.href = 'cart.html';
}

// Show crypto payment info
function showCryptoPayment() {
    document.getElementById('crypto-info').style.display = 'block';
}

// Redirect to contact for other payments
function redirectToContact() {
    window.location.href = 'contact.html';
}

// Redirect to Telegram
function redirectToTelegram() {
    window.open(telegramLink, '_blank');
}

// Redirect to Email
function redirectToEmail() {
    const subject = encodeURIComponent('Support Request - [Order ID]');
    const body = encodeURIComponent('Hello,\n\nI need support. Please find the details below.\n\nOrder ID: [enter order id]\nTXID: [paste transaction id]\nMessage: [your message]\n\nThanks.');
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
}

function copySupportEmail() {
    if (!navigator.clipboard) {
        alert(`Please copy this email manually: ${supportEmail}`);
        return;
    }

    navigator.clipboard.writeText(supportEmail)
        .then(() => {
            alert('Support email copied to clipboard: ' + supportEmail);
        })
        .catch(() => {
            alert(`Please copy this email manually: ${supportEmail}`);
        });
}

// Load cart on cart page
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    const cartIcon = document.querySelector('.icons a[href*="cart"]');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showCart();
        });
    }

    // If on cart page, display items
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
    }
});

// Display cart items on cart page
function displayCartItems() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalDiv = document.getElementById('cart-total');
    if (!cartItemsDiv || !cartTotalDiv) return;

    cartItemsDiv.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalDiv.textContent = 'Total: $0.00';
        return;
    }

    cart.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <p>${item.name} - $${item.price}</p>
            <button onclick="removeFromCart(${index})">Remove</button>
        `;
        cartItemsDiv.appendChild(itemDiv);
        total += item.price;
    });
    cartTotalDiv.textContent = `Total: $${total.toFixed(2)}`;
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCartItems();
}

// Attach to cart icon
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    const cartIcon = document.querySelector('.icons a[href*="shop"]');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showCart();
        });
    }
});

// Product search/filter
function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const products = document.querySelectorAll('.product-card');
    products.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? 'block' : 'none';
    });
}

// Contact form validation and submission
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !subject || !message) {
        alert('All fields are required');
        return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        alert('Invalid email');
        return false;
    }
    // For demo, just alert success. In real, submit to Formspree.
    alert('Message sent successfully!');
    return true;
}

// --- Checkout flow helpers ---
function goToCheckout() {
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    if (currentCart.length === 0) {
        alert('Your cart is empty.');
        return;
    }
    window.location.href = 'checkout.html';
}

function goBackToCart() {
    window.location.href = 'cart.html';
}

function displayCheckoutItems() {
    const itemsDiv = document.getElementById('checkout-items');
    const totalDiv = document.getElementById('checkout-total');
    if (!itemsDiv || !totalDiv) return;

    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    itemsDiv.innerHTML = '';
    if (currentCart.length === 0) {
        itemsDiv.innerHTML = '<p>Your cart is empty. <a href="shop.html">Continue shopping</a></p>';
        totalDiv.textContent = 'Total: $0.00';
        return;
    }

    let total = 0;
    currentCart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'checkout-item';
        div.innerHTML = `<span>${item.name}</span><span class="item-price">$${item.price}</span>`;
        itemsDiv.appendChild(div);
        total += item.price;
    });
    totalDiv.textContent = `Total: $${total.toFixed(2)}`;
}

// run checkout display when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('checkout.html')) {
        displayCheckoutItems();
    }
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
    }
});