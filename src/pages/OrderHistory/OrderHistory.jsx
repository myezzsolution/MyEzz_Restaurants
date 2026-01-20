import { useState, useEffect } from 'react';
import { Download, Search, Calendar, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './OrderHistory.module.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Mock Data Generator
  useEffect(() => {
    const generateMockHistory = () => {
      const statuses = ['completed', 'cancelled', 'refunded'];
      const mockData = Array.from({ length: 25 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        return {
          id: `ORD${2000 + i}`,
          customerName: ['Yug Patel', 'Aksh Maheshwari', 'Nayan Chellani', 'Rahul Verma', 'Sneha Gupta'][Math.floor(Math.random() * 5)],
          items: [
            { name: 'Margherita Pizza', quantity: Math.floor(Math.random() * 2) + 1 },
            { name: 'Cold Coffee', quantity: Math.floor(Math.random() * 2) + 1 },
            { name: 'French Fries', quantity: Math.floor(Math.random() * 2) }
          ].filter(item => item.quantity > 0),
          total: Math.floor(Math.random() * 500) + 150,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          paymentMethod: ['Credit Card', 'UPI', 'Cash', 'Debit Card'][Math.floor(Math.random() * 4)],
          date: date.toISOString()
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      setOrders(mockData);
      setLoading(false);
    };

    // Simulate API call
    setTimeout(generateMockHistory, 1000);
  }, []);

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    // Robust date comparison: compare standard date strings to avoid timezone shifts
    const matchesDate = !dateFilter || new Date(order.date).toLocaleDateString() === new Date(dateFilter + 'T00:00:00').toLocaleDateString();

    return matchesSearch && matchesStatus && matchesDate;
  });

  // PDF Download Handler

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Add Header
    doc.setFontSize(20);
    doc.text('Order History Report', 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Prepare Table Data
    const tableColumn = ["Order ID", "Date", "Customer", "Items", "Status", "Amount"];
    const tableRows = filteredOrders.map(order => [
      order.id,
      new Date(order.date).toLocaleDateString() + ' ' + new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      order.customerName,
      order.items.map(item => `${item.quantity}x ${item.name}`).join(', '),
      order.status.toUpperCase(),
      `$${order.total.toFixed(2)}`
    ]);

    // Generate Table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [255, 102, 0], // Sunset Orange
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    doc.save('order-history.pdf');
  };

  // Individual Receipt Download
  const downloadReceipt = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(255, 102, 0); // Sunset Orange
    doc.text('RESTAURANT RECEIPT', pageWidth / 2, 20, { align: 'center' });

    // Restaurant Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('MyEzz Restaurant Partner', pageWidth / 2, 30, { align: 'center' });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 35, pageWidth - 15, 35);

    // Order Details
    doc.setFontSize(10);
    doc.text(`Order ID: #${order.id}`, 15, 45);
    doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, pageWidth - 15, 45, { align: 'right' });
    doc.text(`Time: ${new Date(order.date).toLocaleTimeString()}`, pageWidth - 15, 50, { align: 'right' });

    doc.text(`Customer: ${order.customerName}`, 15, 55);
    doc.text(`Payment Method: ${order.paymentMethod}`, 15, 60);

    // Items Table
    const tableColumn = ["Item", "Qty", "Price"];
    const tableRows = order.items.map(item => [
      item.name,
      item.quantity,
      // Approximating item price since we only mocked total
      `$${((order.total / order.items.length).toFixed(2))}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { borderBottomWidth: 1, borderColor: [200, 200, 200] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY || 100;

    // Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: $${order.total.toFixed(2)}`, pageWidth - 15, finalY + 15, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for ordering with us!', pageWidth / 2, finalY + 30, { align: 'center' });

    doc.save(`receipt-${order.id}.pdf`);
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      case 'refunded': return <AlertCircle size={16} />;
      default: return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      case 'refunded': return styles.statusRefunded;
      default: return '';
    }
  };

  return (
    <div className={styles.orderHistory}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Order History</h1>
        <button onClick={downloadPDF} className={styles.downloadBtn}>
          <Download size={20} />
          <span>Download Report</span>
        </button>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search Order ID or Customer..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <input
            type="date"
            className={styles.dateInput}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Status</th>
              <th>Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading history...</td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td className={styles.orderId}>#{order.id}</td>
                  <td>
                    {new Date(order.date).toLocaleDateString()}
                    <span style={{ color: 'var(--color-slate-silver)', fontSize: '0.85em', marginLeft: '8px' }}>
                      {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className={styles.customerName}>{order.customerName}</td>
                  <td>
                    <div className={styles.itemsList}>
                      {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </td>
                  <td className={styles.amount}>₹{order.total.toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => downloadReceipt(order)}
                      className={styles.actionBtn}
                      title="Download Receipt"
                    >
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles.emptyState}>
                  No orders found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderHistory;
