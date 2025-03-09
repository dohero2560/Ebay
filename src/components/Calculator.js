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
      
      return price;
    };

    const ebayPrice = calculateEbayPrice();
    const ebayFeePercent = ebayPrice <= 5000 ? 15 : 9;
    const ebayFeeMoney = ebayPrice * (ebayFeePercent / 100);
    const profit = (ebayPrice * exchangeRate) - cost;

    setResults({
      ebayPrice: ebayPrice.toFixed(2),
      ebayFeePercent: ebayFeePercent,
      ebayFeeMoney: ebayFeeMoney.toFixed(2),
      profit: profit.toFixed(2)
    });
  };

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
        </div>
      )}
    </div>
  );
}

export default Calculator; 