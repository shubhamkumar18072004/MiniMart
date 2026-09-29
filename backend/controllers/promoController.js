const { computeSubtotalFromItems, resolvePromoForSubtotal } = require("../utils/promoDiscount");

exports.validatePromo = async (req, res) => {
    try {
        const subtotal = computeSubtotalFromItems(req.body.items || []);
        if (subtotal <= 0) {
            return res.status(400).json({ success: false, message: "Cart khali ya amount 0." });
        }

        const code = req.body.code;
        const result = await resolvePromoForSubtotal(code, subtotal);
        if (!result.ok) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.json({
            success: true,
            code: result.code,
            discountType: result.discountType,
            discountValue: result.discountValue,
            subtotal: result.subtotal,
            discountAmount: result.discountAmount,
            finalTotal: result.finalTotal
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
