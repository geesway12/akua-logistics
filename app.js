import { openDB, saveItem, getAllItems, deleteItem } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  await openDB();
  await loadItems();

  document.getElementById('itemForm')
    .addEventListener('submit', async e => {
      e.preventDefault();

      const name      = document.getElementById('itemName').value.trim();
      const desc      = document.getElementById('description').value.trim();
      const costRMB   = parseFloat(document.getElementById('itemCost').value);
      const rmbToGhs  = parseFloat(document.getElementById('rmbToGhs').value);
      const L         = parseFloat(document.getElementById('length').value)  || null;
      const W         = parseFloat(document.getElementById('width').value)   || null;
      const H         = parseFloat(document.getElementById('height').value)  || null;
      const usdPerCBM = parseFloat(document.getElementById('usdPerCbm').value);
      const usdToGhs  = parseFloat(document.getElementById('usdToGhs').value);
      const commPct   = parseFloat(document.getElementById('commissionPercent').value);
      const profPct   = parseFloat(document.getElementById('profitPercent').value);

      // Read up to 5 images
      const files = Array.from(document.getElementById('itemImages').files).slice(0,5);
      const imagesData = await Promise.all(files.map(file => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload  = () => res(reader.result);
        reader.onerror = () => rej(reader.error);
        reader.readAsDataURL(file);
      })));

      // Calculations
      const costGHS       = costRMB * rmbToGhs;
      const cbm           = (L>0 && W>0 && H>0) ? (L*W*H)/1_000_000 : null;
      const shipGHS       = cbm != null ? (cbm * usdPerCBM * usdToGhs) : null;
      const shipNote      = shipGHS == null ? 'Shipping estimated at 50–70% of item cost' : null;
      const commAmt       = costGHS * (commPct/100);
      const profAmt       = costGHS * (profPct/100);
      const salesPriceGHS = costGHS + commAmt + profAmt + (shipGHS||0);

      // Build and save
      const item = {
        name, desc,
        imagesData,
        costRMB, costGHS,
        cbm, shipGHS, shipNote,
        commPct, commAmt,
        profPct, profAmt,
        salesPriceGHS,
        timestamp: new Date().toISOString()
      };

      await saveItem(item);
      await loadItems();
      document.getElementById('itemForm').reset();
    });

  document.getElementById('exportBtn').addEventListener('click', exportToExcel);
  document.getElementById('exportJsonBtn').addEventListener('click', exportToJSON);
});

async function loadItems() {
  const items = await getAllItems();
  const tbody = document.getElementById('itemsBody');
  tbody.innerHTML = '';

  items.forEach(i => {
    const thumb = i.imagesData?.[0] 
      ? `<img src="${i.imagesData[0]}" style="width:60px;">` 
      : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${thumb}</td>
      <td>${i.name}</td>
      <td>${i.desc}</td>
      <td>${i.costRMB}</td>
      <td>${i.costGHS.toFixed(2)}</td>
      <td>${i.cbm?.toFixed(3) || ''}</td>
      <td>${
        i.shipGHS != null 
          ? i.shipGHS.toFixed(2) 
          : `<span class="text-muted">${i.shipNote}</span>`
      }</td>
      <td>${i.commPct}%</td>
      <td>${i.commAmt.toFixed(2)}</td>
      <td>${i.profPct}%</td>
      <td>${i.profAmt.toFixed(2)}</td>
      <td>${i.salesPriceGHS.toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="removeItem(${i.id})">
          Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.removeItem = async function(id) {
  await deleteItem(id);
  await loadItems();
};

async function exportToExcel() {
  const items = await getAllItems();
  const rows = items.map(i => ({
    'Item Name'       : i.name,
    'Description'     : i.desc,
    'Cost (RMB)'      : i.costRMB,
    'Cost (GHS)'      : i.costGHS.toFixed(2),
    'CBM'             : i.cbm?.toFixed(3) || '',
    'Shipping (GHS)'  : i.shipGHS?.toFixed(2) || i.shipNote,
    'Commission %'    : i.commPct,
    'Commission (GHS)': i.commAmt.toFixed(2),
    'Profit %'        : i.profPct,
    'Profit (GHS)'    : i.profAmt.toFixed(2),
    'Sales Price GHS' : i.salesPriceGHS.toFixed(2),
    'Timestamp'       : i.timestamp
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales');
  XLSX.writeFile(wb, 'sales_items.xlsx');
}

async function exportToJSON() {
  const items = await getAllItems();
  const blob  = new Blob([JSON.stringify(items, null,2)], { type:'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = 'items.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
