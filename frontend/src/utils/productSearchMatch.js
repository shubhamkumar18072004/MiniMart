/**
 * Hindi/Hinglish spoken queries ko English catalogue names se jodne ke liye chhota synonym layer.
 */
const HI_EN_FRAGMENTS = [
  ['दूध', 'milk'],
  ['दही', 'curd'],
  ['चावल', 'rice'],
  ['आटा', 'atta'],
  ['आटा', 'flour'],
  ['चीनी', 'sugar'],
  ['नमक', 'salt'],
  ['तेल', 'oil'],
  ['घी', 'ghee'],
  ['अंडा', 'egg'],
  ['अंडे', 'egg'],
  ['पनीर', 'paneer'],
  ['आलू', 'potato'],
  ['प्याज', 'onion'],
  ['टमाटर', 'tomato'],
  ['अदरक', 'ginger'],
  ['लहसुन', 'garlic'],
  ['मिर्च', 'chilli'],
  ['हरी मिर्च', 'chilli'],
  ['सब्जी', 'vegetable'],
  ['सब्ज़ी', 'vegetable'],
  ['फल', 'fruit'],
  ['मक्खन', 'butter'],
  ['ब्रेड', 'bread'],
  ['दाल', 'dal'],
  ['चाय', 'tea'],
  ['कॉफ़ी', 'coffee'],
  ['कॉफी', 'coffee'],
  ['पानी', 'water'],
  ['बिस्कुट', 'biscuit'],
  ['बिस्किट', 'biscuit'],
  ['नमकीन', 'snack'],
  ['शैम्पू', 'shampoo'],
  ['साबुन', 'soap'],
  ['बर्तन', 'cleaning'],
  ['सफाई', 'cleaning'],
  ['मसाला', 'masala'],
  ['हल्दी', 'turmeric'],
  ['धनिया', 'coriander'],
  ['गुड़', 'jaggery'],
  ['शहद', 'honey'],
  ['जूस', 'juice'],
  ['कोल्ड ड्रिंक', 'drink'],
  ['आइसक्रीम', 'ice cream'],
  ['दही', 'yogurt'],
  ['अंगूर', 'grape'],
  ['केला', 'banana'],
  ['संतरा', 'orange'],
  ['सेब', 'apple'],
  ['गाजर', 'carrot'],
  ['भिंडी', 'okra'],
  ['बैंगन', 'brinjal'],
  ['पालक', 'spinach'],
  ['हरी मटर', 'peas'],
  ['चॉकलेट', 'chocolate'],
  ['टूथपेस्ट', 'toothpaste'],
  ['टिशू', 'tissue']
];

export function enrichSearchQuery(raw) {
  const base = (raw || '').trim().toLowerCase();
  if (!base) return '';
  let extra = '';
  for (const [hi, en] of HI_EN_FRAGMENTS) {
    if (base.includes(hi.toLowerCase())) {
      extra += ` ${en}`;
    }
  }
  return `${base}${extra}`.trim();
}

export function productMatchesSearch(product, queryRaw) {
  const q = enrichSearchQuery(queryRaw);
  if (!q) return true;
  const hay = `${product.name || ''} ${product.category || ''}`.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);
  return tokens.some((t) => hay.includes(t));
}
