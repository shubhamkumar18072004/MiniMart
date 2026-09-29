/**
 * DB me purane products par `unitType` missing ho sakta hai — packet ke liye weight text se infer.
 */
export function resolveUnitType(product) {
  const raw = product?.unitType;
  const u = raw == null ? "" : String(raw).trim().toLowerCase();
  if (u === "quantity" || u === "packet" || u === "weight") return u;
  const w = String(product?.weight ?? "").trim();
  if (/packet|पैक/i.test(w)) return "packet";
  return "weight";
}

/** Inventory UI: DB value prefer, warna infer (purane products) */
export function initialInventoryUnitType(product) {
  const s = String(product?.unitType ?? "").trim().toLowerCase();
  if (s === "quantity" || s === "packet" || s === "weight") return s;
  return resolveUnitType(product);
}

/**
 * Customer-facing unit label from product.unitType, weight, quantity.
 */
export function formatProductUnit(product) {
  const weightRaw = String(product?.weight ?? "").trim();
  const unitType = resolveUnitType(product);
  const qtyRaw = product?.quantity;
  const qtyNum = Number(qtyRaw);
  const qtyOk = !Number.isNaN(qtyNum) && qtyNum > 0;

  if (unitType === "quantity") {
    if (qtyOk) return `${qtyNum} Pcs`;
    if (!Number.isNaN(qtyNum) && qtyNum === 0) return "0 Pcs";
    return "1 Pc";
  }

  if (unitType === "packet") {
    // Pehle sell-count (quantity) — warna weight me "1 Packet" hone par count chhup jata tha
    if (qtyOk) return `${qtyNum} ${qtyNum === 1 ? "Packet" : "Packets"}`;
    const weightNum = (() => {
      const m = weightRaw.match(/[\d.]+/);
      return m ? m[0] : weightRaw;
    })();
    if (weightNum && weightRaw) {
      if (/packet|पैक/i.test(weightRaw)) return weightRaw;
      return `${weightNum} Packet`;
    }
    return "1 Packet";
  }

  const weightNum = (() => {
    const m = weightRaw.match(/[\d.]+/);
    return m ? m[0] : weightRaw;
  })();

  // Explicit weight listing: quantity is stock only — do not show as "packets" on the card.
  if (unitType === "weight") {
    if (/kg/i.test(weightRaw)) return `${weightNum} Kg`;
    if (!/kg/i.test(weightRaw) && /g/i.test(weightRaw)) return `${weightNum} g`;
    if (weightRaw) return weightRaw;
    return "—";
  }

  const packetQty = qtyOk ? qtyNum : null;

  if (/kg/i.test(weightRaw)) {
    if (packetQty !== null) return `${weightNum} Kg • ${packetQty} Packet`;
    return `${weightNum} Kg`;
  }

  if (!/kg/i.test(weightRaw) && /g/i.test(weightRaw)) return `${weightNum} g`;

  if (weightRaw) {
    if (packetQty !== null) return `${weightNum} Kg • ${packetQty} Packet`;
    return `${weightNum} Kg`;
  }

  return packetQty !== null ? `${packetQty} Packet` : "1 Packet";
}

export function isProductInStock(product) {
  if (!product || product.inStock === false) return false;
  return true;
}
