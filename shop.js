/* Akua Logistics – Static‑JSON shop with multi‑image */

let cart    = [];
let catalog = [];
const whatsappNumber = '233555613718'; // ← your number

document.addEventListener('DOMContentLoaded', loadCatalog);

async function loadCatalog() {
  try {
    const res = await fetch('items.json');
    catalog = await res.json();
  } catch {
    catalog = [];
  }
  renderItems(catalog);
  document.getElementById('checkoutBtn')
          .addEventListener('click', checkoutCart);
}

function renderItems(items) {
  const wrap = document.getElementById('shopItems');
  wrap.innerHTML = '';

  if (!items.length) {
    wrap.innerHTML = '<p class="text-center text-muted">No items available.</p>';
    return;
  }

  items.forEach(i => {
    const imgs = (i.imagesData || []).map(src =>
      `<img src="${src}" class="img-fluid mb-2">`
    ).join('') || '<p class="text-muted">No image</p>';

    const shippingDisplay = i.shipGHS != null
      ? `GHS ${parseFloat(i.shipGHS).toFixed(2)}`
      : '<em>Shipping: 50–70% of cost</em>';

    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          ${imgs}
          <h5 class="card-title">${i.name}</h5>
          <p class="card-text">${i.desc}</p>
          <p class="mb-1"><strong>Cost:</strong> GHS ${parseFloat(i.costGHS).toFixed(2)}</p>
          <p class="mb-3"><strong>Shipping:</strong> ${shippingDisplay}</p>
          <button class="btn btn-outline-primary mt-auto"
                  onclick='addToCart(${JSON.stringify(i)})'>
            Add to Cart
          </button>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}

function addToCart(item) {
  cart.push(item);
  alert(`Added "${item.name}" to cart.`);
}

function checkoutCart() {
  if (!cart.length) return alert('Your cart is empty.');
  let msg = 'Hi, I’d like to order the following from Akua Logistics:\n';
  cart.forEach((it, idx) => {
    const shipPart = it.shipGHS != null
      ? ` + GHS ${parseFloat(it.shipGHS).toFixed(2)} shipping`
      : ' + shipping (50–70% of cost)';
    msg += `${idx+1}. ${it.name} – GHS ${parseFloat(it.costGHS).toFixed(2)}${shipPart}\n`;
  });
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}
