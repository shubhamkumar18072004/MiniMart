const PromoCode = require("../models/PromoCode");

const linePrice = (item) => {
    const p = item?.price;
    if (typeof p === "number" && !Number.isNaN(p)) return p;
    return parseInt(String(p).replace(/[^\d]/g, ""), 10) || 0;
};

exports.computeSubtotalFromItems = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((acc, item) => acc + linePrice(item) * (Number(item?.qty) || 0), 0);
};

exports.findActivePromoByCode = async (rawCode) => {
    const code = String(rawCode || "").trim().toUpperCase();
    if (!code) return null;
    const doc = await PromoCode.findOne({ code, isActive: true }).lean();
    if (!doc) return null;
    if (doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now()) {
        return null;
    }
    return doc;
};

/**
 * @param {object} promo — lean PromoCode doc
 * @param {number} subtotal — rupees (integer-ish)
 */
exports.applyPromoToSubtotal = (promo, subtotal) => {
    const sub = Math.max(0, Math.round(Number(subtotal) || 0));
    const min = Math.max(0, Math.round(Number(promo.minOrderValue) || 0));
    if (sub < min) {
        return {
            ok: false,
            message: `Is promo ke liye minimum order ₹${min} hona chahiye (abhi ₹${sub}).`
        };
    }

    let discount = 0;
    if (promo.discountType === "percentage") {
        discount = Math.floor((sub * (Number(promo.discountValue) || 0)) / 100);
    } else {
        discount = Math.min(sub, Math.round(Number(promo.discountValue) || 0));
    }

    const finalTotal = Math.max(0, sub - discount);
    return {
        ok: true,
        subtotal: sub,
        discountAmount: discount,
        finalTotal
    };
};

exports.resolvePromoForSubtotal = async (rawCode, subtotal) => {
    const promo = await exports.findActivePromoByCode(rawCode);
    if (!promo) {
        return { ok: false, message: "Promo code valid / active nahi hai." };
    }
    const applied = exports.applyPromoToSubtotal(promo, subtotal);
    if (!applied.ok) return applied;
    return {
        ok: true,
        subtotal: applied.subtotal,
        discountAmount: applied.discountAmount,
        finalTotal: applied.finalTotal,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue
    };
};
