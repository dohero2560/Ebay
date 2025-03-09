import React, { useState, useEffect } from 'react';

function Calculator() {
  const [inputs, setInputs] = useState({
    cost: '',
    exchangeRate: '',
    commission: '5'
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [category, setCategory] = useState('other');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [shippingWeight, setShippingWeight] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [shippingDestination, setShippingDestination] = useState('domestic');
  const [salesTaxRate, setSalesTaxRate] = useState(0);
  const [targetProfitMargin, setTargetProfitMargin] = useState(20); // 20% default

  // Add category-specific fee rates
  const categoryFeeRates = {
    electronics: 0.1, // 10%
    clothing: 0.12, // 12%
    collectibles: 0.125, // 12.5%
    homeGarden: 0.09, // 9%
    other: 0.11, // 11% default
  };

  // เพิ่มฟังก์ชันดึงอัตราแลกเปลี่ยน
  const fetchExchangeRate = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      const thbRate = data.rates.THB;
      setInputs(prev => ({
        ...prev,
        exchangeRate: thbRate.toFixed(2)
      }));
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลอัตราแลกเปลี่ยนได้');
      console.error('Error fetching exchange rate:', err);
    } finally {
      setLoading(false);
    }
  };

  // เรียกใช้ฟังก์ชันดึงข้อมูลเมื่อโหลดคอมโพเนนต์
  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'category') {
      setCategory(value);
    } else if (name === 'shippingWeight') {
      setShippingWeight(parseFloat(value) || 0);
    } else if (name === 'shippingMethod') {
      setShippingMethod(value);
    } else if (name === 'shippingDestination') {
      setShippingDestination(value);
    }
  };

  const calculateShippingCost = () => {
    const baseCost = {
      standard: { domestic: 3.99, international: 9.99 },
      express: { domestic: 7.99, international: 24.99 }
    };
    
    // Weight surcharge: $1 per pound after the first pound
    const weightSurcharge = Math.max(0, (shippingWeight - 1)) * 1;
    
    return baseCost[shippingMethod][shippingDestination] + weightSurcharge;
  };

  const calculatePrice = () => {
    const cost = parseFloat(inputs.cost);
    const exchangeRate = parseFloat(inputs.exchangeRate);
    const commission = parseFloat(inputs.commission);

    if (!cost || !exchangeRate) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // คำนวณราคาขายบน eBay
    const calculateEbayPrice = () => {
      const paypalFee = 1.3;
      let ebayFee;
      let price = 0;
      
      for (let i = 0; i < 100; i++) {
        const previousPrice = price;
        ebayFee = previousPrice <= 5000 ? 15 : 9;
        
        price = (cost * (1 + commission/100)) / 
                (exchangeRate * (1 - ebayFee/100 - paypalFee/100 - commission/100));
        
        if (Math.abs(price - previousPrice) < 0.01) break;
      }
      
      const shippingCost = calculateShippingCost();
      
      return {
        ebayPrice: price.toFixed(2),
        ebayFeePercent: ebayFee,
        ebayFeeMoney: (price * (ebayFee/100)).toFixed(2),
        profit: ((price * exchangeRate) - cost).toFixed(2),
        shippingCost,
        totalWithShipping: (price + shippingCost).toFixed(2)
      };
    };

    const ebayPrice = calculateEbayPrice();
    const ebayFeePercent = ebayPrice.ebayFeePercent;
    const ebayFeeMoney = ebayPrice.ebayFeeMoney;
    const profit = ebayPrice.profit;
    const shippingCost = ebayPrice.shippingCost;
    const totalWithShipping = ebayPrice.totalWithShipping;

    setResults({
      ebayPrice: ebayPrice.ebayPrice,
      ebayFeePercent: ebayFeePercent,
      ebayFeeMoney: ebayFeeMoney,
      profit: profit,
      shippingCost: shippingCost.toFixed(2),
      totalWithShipping: totalWithShipping
    });

    // Calculate minimum price needed to achieve target profit margin
    const calculateMinimumPrice = () => {
      const costs = /* sum of all costs */;
      return costs / (1 - (targetProfitMargin / 100));
    };
  };

  const saveCalculation = () => {
    const newCalculation = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      itemName: /* get item name */,
      result: results
    };
    
    setSavedCalculations([newCalculation, ...savedCalculations]);
    
    // Optionally save to localStorage
    localStorage.setItem('savedCalculations', JSON.stringify([newCalculation, ...savedCalculations]));
  };
  
  // Load saved calculations from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedCalculations');
    if (saved) {
      setSavedCalculations(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="calculator">
      <div className="input-group">
        <label>
          ราคาต้นทุนสินค้า (THB):
          <input
            type="number"
            name="cost"
            value={inputs.cost}
            onChange={handleInputChange}
            placeholder="เช่น 50000"
          />
        </label>

        <label>
          อัตราแลกเปลี่ยน (THB/USD):
          <div className="exchange-rate-input">
            <input
              type="number"
              name="exchangeRate"
              value={inputs.exchangeRate}
              onChange={handleInputChange}
              placeholder="เช่น 33.5"
            />
            <button 
              onClick={fetchExchangeRate}
              className="refresh-button"
              disabled={loading}
            >
              {loading ? 'กำลังโหลด...' : '🔄 ดึงค่าล่าสุด'}
            </button>
          </div>
          {error && <span className="error-message">{error}</span>}
        </label>

        <label>
          ค่าคอมมิชชั่น (%):
          <input
            type="number"
            name="commission"
            value={inputs.commission}
            onChange={handleInputChange}
            placeholder="เช่น 5"
          />
        </label>

        <label>
          Item Category
          <select name="category" value={category} onChange={handleInputChange}>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing & Accessories</option>
            <option value="collectibles">Collectibles</option>
            <option value="homeGarden">Home & Garden</option>
            <option value="other">Other</option>
          </select>
        </label>
        
        <button 
          type="button" 
          className="toggle-advanced"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>
        
        {showAdvancedOptions && (
          <div className="advanced-options">
            <label>
              Custom Fee Rate (%)
              <input
                type="number"
                name="customFeeRate"
                value={customFeeRate}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                max="100"
              />
            </label>
            {/* More advanced options can go here */}
          </div>
        )}

        <label>
          Shipping Weight (pounds):
          <input
            type="number"
            name="shippingWeight"
            value={shippingWeight}
            onChange={handleInputChange}
            placeholder="เช่น 1"
          />
        </label>

        <label>
          Shipping Method
          <select name="shippingMethod" value={shippingMethod} onChange={handleInputChange}>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </label>

        <label>
          Shipping Destination
          <select name="shippingDestination" value={shippingDestination} onChange={handleInputChange}>
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
          </select>
        </label>

        <button onClick={calculatePrice}>คำนวณ</button>
      </div>

      {results && (
        <div className="results">
          <h2>ผลการคำนวณ</h2>
          <div className="result-item">
            <span>ราคาขายบน eBay:</span>
            <span>${results.ebayPrice}</span>
          </div>
          <div className="result-item">
            <span>ค่าธรรมเนียม eBay:</span>
            <span>{results.ebayFeePercent}%</span>
          </div>
          <div className="result-item">
            <span>ค่าธรรมเนียม eBay เป็นเงิน:</span>
            <span>${results.ebayFeeMoney}</span>
          </div>
          <div className="result-item">
            <span>กำไรที่ได้รับ:</span>
            <span>{results.profit} THB</span>
          </div>
          <div className="result-item">
            <span>ค่าส่งสินค้า:</span>
            <span>${results.shippingCost}</span>
          </div>
          <div className="result-item">
            <span>ราคารวมกับค่าส่งสินค้า:</span>
            <span>${results.totalWithShipping}</span>
          </div>
        </div>
      )}

      <button onClick={saveCalculation}>Save Calculation</button>
      
      {savedCalculations.length > 0 && (
        <div className="saved-calculations">
          <h3>Saved Calculations</h3>
          {savedCalculations.map(calc => (
            <div key={calc.id} className="saved-calculation-item">
              {/* Display saved calculation details */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Calculator; 