'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProductsPage() {
  // รายการสินค้าทั้งหมด
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // ฟอร์มเพิ่มสินค้าใหม่
  const [form, setForm] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: '',
  });

  // แถวที่กำลังแก้ไข (เก็บ id) และค่าฟอร์มแก้ไข
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // โหลดรายการสินค้าตอนเปิดหน้า
  useEffect(() => {
    fetchProducts();
  }, []);

  // ดึงข้อมูลสินค้าทั้งหมดจากตาราง products เรียงตามวันที่สร้างล่าสุด
  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setProducts(data);
      setErrorMsg('');
    }
    setLoading(false);
  }

  // จัดการค่าฟอร์มเพิ่มสินค้า
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // เพิ่มสินค้าใหม่ลงตาราง products
  async function handleAddProduct(e) {
    e.preventDefault();
    if (!form.sku || !form.name) {
      setErrorMsg('กรุณากรอก SKU และชื่อสินค้า');
      return;
    }

    const { error } = await supabase.from('products').insert([
      {
        sku: form.sku,
        name: form.name,
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock, 10) || 0,
        unit: form.unit,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // ล้างฟอร์มและโหลดรายการใหม่
    setForm({ sku: '', name: '', price: '', stock: '', unit: '' });
    fetchProducts();
  }

  // ลบสินค้า
  async function handleDelete(id) {
    const confirmDelete = confirm('ยืนยันการลบสินค้านี้?');
    if (!confirmDelete) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    fetchProducts();
  }

  // เริ่มแก้ไขแถว (inline)
  function startEdit(product) {
    setEditingId(product.id);
    setEditForm({
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
    });
  }

  // ยกเลิกการแก้ไข
  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  // จัดการค่าฟอร์มแก้ไข
  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  // บันทึกการแก้ไขสินค้ากลับลง Supabase
  async function handleSaveEdit(id) {
    const { error } = await supabase
      .from('products')
      .update({
        sku: editForm.sku,
        name: editForm.name,
        price: parseFloat(editForm.price) || 0,
        stock: parseInt(editForm.stock, 10) || 0,
        unit: editForm.unit,
      })
      .eq('id', id);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setEditingId(null);
    setEditForm({});
    fetchProducts();
  }

  return (
    <div>
      <h1>รายการสินค้า</h1>

      {errorMsg && (
        <div style={{ color: '#dc2626', marginBottom: 12 }}>{errorMsg}</div>
      )}

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 16 }}>เพิ่มสินค้าใหม่</h2>
        <form onSubmit={handleAddProduct}>
          <div className="form-row">
            <input
              name="sku"
              placeholder="SKU"
              value={form.sku}
              onChange={handleFormChange}
            />
            <input
              name="name"
              placeholder="ชื่อสินค้า"
              value={form.name}
              onChange={handleFormChange}
            />
            <input
              name="price"
              type="number"
              step="0.01"
              placeholder="ราคา"
              value={form.price}
              onChange={handleFormChange}
            />
            <input
              name="stock"
              type="number"
              placeholder="คงเหลือ"
              value={form.stock}
              onChange={handleFormChange}
            />
            <input
              name="unit"
              placeholder="หน่วย"
              value={form.unit}
              onChange={handleFormChange}
            />
            <button type="submit">เพิ่มสินค้า</button>
          </div>
        </form>
      </div>

      {/* ตารางแสดงสินค้า */}
      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>ชื่อสินค้า</th>
              <th>ราคา</th>
              <th>คงเหลือ</th>
              <th>หน่วย</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                {editingId === p.id ? (
                  // โหมดแก้ไข inline
                  <>
                    <td>
                      <input
                        name="sku"
                        value={editForm.sku}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        name="price"
                        type="number"
                        step="0.01"
                        value={editForm.price}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        name="stock"
                        type="number"
                        value={editForm.stock}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        name="unit"
                        value={editForm.unit}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <button onClick={() => handleSaveEdit(p.id)}>
                        บันทึก
                      </button>{' '}
                      <button onClick={cancelEdit}>ยกเลิก</button>
                    </td>
                  </>
                ) : (
                  // โหมดแสดงผลปกติ
                  <>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{p.price}</td>
                    <td>{p.stock}</td>
                    <td>{p.unit}</td>
                    <td>
                      <button onClick={() => startEdit(p)}>แก้ไข</button>{' '}
                      <button onClick={() => handleDelete(p.id)}>ลบ</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>
                  ยังไม่มีสินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
