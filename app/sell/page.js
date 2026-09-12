'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  // รายการสินค้าทั้งหมด (สำหรับ dropdown)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ฟอร์มขายสินค้า
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // โหลดรายการสินค้าตอนเปิดหน้า
  useEffect(() => {
    fetchProducts();
  }, []);

  // ดึงข้อมูลสินค้าทั้งหมดจากตาราง products
  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setProducts(data);
      setErrorMsg('');
    }
    setLoading(false);
  }

  // สินค้าที่ถูกเลือกอยู่ในปัจจุบัน
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // ยอดรวม = ราคา x จำนวน
  const qtyNumber = parseInt(quantity, 10) || 0;
  const totalPrice = selectedProduct ? selectedProduct.price * qtyNumber : 0;

  // จัดการการกดปุ่ม "ขาย"
  async function handleSell(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProduct) {
      setErrorMsg('กรุณาเลือกสินค้า');
      return;
    }
    if (qtyNumber <= 0) {
      setErrorMsg('กรุณากรอกจำนวนที่ต้องการขายให้ถูกต้อง');
      return;
    }
    // ตรวจสอบ stock เพียงพอหรือไม่
    if (qtyNumber > selectedProduct.stock) {
      setErrorMsg(
        `สินค้าคงเหลือไม่พอ (เหลือ ${selectedProduct.stock} ${selectedProduct.unit})`
      );
      return;
    }

    setSubmitting(true);

    // 1. บันทึกรายการขายลงตาราง sales
    const { error: saleError } = await supabase.from('sales').insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qtyNumber,
        total_price: totalPrice,
        sold_at: new Date().toISOString(),
      },
    ]);

    if (saleError) {
      setErrorMsg(saleError.message);
      setSubmitting(false);
      return;
    }

    // 2. อัปเดต stock ในตาราง products ให้ลดลง
    const newStock = selectedProduct.stock - qtyNumber;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (updateError) {
      setErrorMsg(updateError.message);
      setSubmitting(false);
      return;
    }

    // สำเร็จ: แจ้งเตือนและรีเซ็ตฟอร์ม
    setSuccessMsg(
      `ขาย "${selectedProduct.name}" จำนวน ${qtyNumber} ${selectedProduct.unit} สำเร็จ (รวม ${totalPrice} บาท)`
    );
    setSelectedProductId('');
    setQuantity('');
    setSubmitting(false);

    // โหลดรายการสินค้าใหม่เพื่ออัปเดต stock ที่แสดงผล
    fetchProducts();
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {errorMsg && (
        <div style={{ color: '#dc2626', marginBottom: 12 }}>{errorMsg}</div>
      )}
      {successMsg && (
        <div style={{ color: '#16a34a', marginBottom: 12 }}>{successMsg}</div>
      )}

      <div className="card">
        {loading ? (
          <p>กำลังโหลดรายการสินค้า...</p>
        ) : (
          <form onSubmit={handleSell}>
            <div className="form-row">
              {/* Dropdown เลือกสินค้า */}
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">-- เลือกสินค้า --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price} บาท / {p.unit}) - คงเหลือ {p.stock}
                  </option>
                ))}
              </select>

              {/* ช่องกรอกจำนวน */}
              <input
                type="number"
                min="1"
                placeholder="จำนวน"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <button type="submit" disabled={submitting}>
                {submitting ? 'กำลังบันทึก...' : 'ขาย'}
              </button>
            </div>

            {/* แสดงยอดรวมอัตโนมัติ */}
            {selectedProduct && (
              <p>
                ยอดรวม:{' '}
                <strong>
                  {totalPrice.toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  บาท
                </strong>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
