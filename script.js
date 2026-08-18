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
    copyText(supportEmail, `Support email copied to clipboard: ${supportEmail}`);
}

function copyWalletAddress() {
    const address = document.getElementById('wallet-address');
    if (!address) return;
    copyText(address.textContent.trim(), 'Wallet address copied to clipboard.');
}

function copyText(text, successMessage) {
    if (!navigator.clipboard) {
        alert(`Please copy this manually: ${text}`);
        return;
    }
    navigator.clipboard.writeText(text)
        .then(() => alert(successMessage))
        .catch(() => alert(`Please copy this manually: ${text}`));
}

// Mark the order as placed: save it to the order tracker, clear the cart, and confirm to the user
async function confirmOrderSent() {
    if (!confirm("Confirm you've sent payment and messaged us your TXID? This will clear your cart.")) {
        return;
    }

    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    const contactInput = document.getElementById('order-contact');
    const contact = contactInput ? contactInput.value.trim() : '';
    const btn = document.querySelector('.order-sent-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Saving your order…';
    }

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: currentCart, contact }),
        });
        if (!res.ok) throw new Error('Order save failed');
    } catch (err) {
        alert("We couldn't save your order automatically, but don't worry — just make sure to message us your TXID and order details directly so we can process it.");
    }

    localStorage.removeItem('cart');
    cart = [];
    updateCartCount();
    alert("Thanks! We'll verify your payment and deliver your order as soon as it's confirmed. Keep an eye on your email/Telegram.");
    window.location.href = 'index.html';
}

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
// NOTE: this site is static (no backend), so "sending" opens the visitor's
// own email client with the message pre-filled to our support address.
// For a fully automatic inbox delivery (no email client required), wire
// this form up to a service like Formspree or EmailJS instead.
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

    const mailSubject = encodeURIComponent(`[loot nexus] ${subject}`);
    const mailBody = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    window.location.href = `mailto:${supportEmail}?subject=${mailSubject}&body=${mailBody}`;

    alert("Opening your email app to send this message. If nothing opens, please email us directly at " + supportEmail);
    return false; // prevent the default form GET-submit; mailto above handles it
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

// Run page-specific setup once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    if (window.location.pathname.includes('checkout.html')) {
        displayCheckoutItems();
    }
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
    }
});