function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const discountFactor = 1 - discount / 100;
    return sale_price * quantity * discountFactor;
  }
  
  function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
  
    if (index === 0) {
      return profit * 0.15;
    } else if (index === 1 || index === 2) {
      return profit * 0.10;
    } else if (index === total - 1) {
      return 0;
    } else {
      return profit * 0.05;
    }
  }
  
  function analyzeSalesData(data, options) {
    // Проверка входных данных
    if (
      !data ||
      !Array.isArray(data.sellers) || data.sellers.length === 0 ||
      !Array.isArray(data.products) || data.products.length === 0 ||
      !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
      throw new Error('Некорректные входные данные');
    }
  
    // Проверка опций
    const { calculateRevenue, calculateBonus } = options || {};
    if (!calculateRevenue || !calculateBonus) {
      throw new Error('Отсутствуют функции расчёта');
    }
  
    // Подготовка статистики по продавцам
    const sellerStats = data.sellers.map(seller => ({
      id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_sold: {}
    }));
  
    // Индексация продавцов и товаров
    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));
  
    // Обработка продаж
    data.purchase_records.forEach(record => {
      const seller = sellerIndex[record.seller_id];
      if (!seller) return;
  
      seller.sales_count += 1;
      seller.revenue += record.total_amount;
  
      record.items.forEach(item => {
        const product = productIndex[item.sku];
        if (!product) return;
  
        const cost = product.purchase_price * item.quantity;
        const revenue = calculateRevenue(item, product);
        const profit = revenue - cost;
  
        seller.profit += profit;
  
        if (!seller.products_sold[item.sku]) {
          seller.products_sold[item.sku] = 0;
        }
        seller.products_sold[item.sku] += item.quantity;
      });
    });
  
    // Сортировка по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
  
    // Назначение бонусов и формирование top_products
    sellerStats.forEach((seller, index) => {
      const totalSellers = sellerStats.length;
      seller.bonus = +calculateBonus(index, totalSellers, seller).toFixed(2);
  
      seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    });
  
    // Возврат результата
    return sellerStats.map(seller => ({
      seller_id: seller.id,
      name: seller.name,
      revenue: +seller.revenue.toFixed(2),
      profit: +seller.profit.toFixed(2),
      sales_count: seller.sales_count,
      top_products: seller.top_products,
      bonus: seller.bonus
    }));
  }
  