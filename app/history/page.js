'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  // รายการประวัติการขายทั้งหมด
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // โหลดข้อมูลตอนเปิดหน้า
  useEffect(() => {
    fetchSales();
  }, []);

  // ดึงข้อมูลจากตาราง sales เรียงจากล่าสุดไปเก่าสุด
  async function fetchSales() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSales(data);
      setErrorMsg('');
    }
    setLoading(false);
  }

  // คำนวณยอดขายรวมทั้งหมดจาก total_price ของทุกแถว
  const totalRevenue = sales.reduce(
    (sum, s) => sum + (Number(s.total_price) || 0),
    0
  );

  // แปลงวันเวลาให้อ่านง่าย (รูปแบบไทย)
  function formatDateTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      {errorMsg && (
        <div style={{ color: '#dc2626', marginBottom: 12 }}>{errorMsg}</div>
      )}

      {/* สรุปยอดขายรวมทั้งหมด */}
      <div className="card">
        <p style={{ margin: 0, fontSize: 16 }}>
          ยอดขายรวมทั้งหมด:{' '}
          <strong>
            {totalRevenue.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
            })}{' '}
            บาท
          </strong>
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
          จำนวนรายการขายทั้งหมด: {sales.length} รายการ
        </p>
      </div>

      {/* ตารางแสดงประวัติการขาย */}
      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>วันเวลาที่ขาย</th>
              <th>ชื่อสินค้า</th>
              <th>จำนวน</th>
              <th>ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{formatDateTime(s.sold_at)}</td>
                <td>{s.product_name}</td>
                <td>{s.quantity}</td>
                <td>
                  {Number(s.total_price).toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  บาท
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  ยังไม่มีประวัติการขาย
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
