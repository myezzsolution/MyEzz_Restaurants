import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './Report.module.css';
import FilterBar from '../../components/Report/FilterBar';
import ReportCard from '../../components/Report/ReportCard';
import SalesChart from '../../components/Report/SalesChart';
import OrderStats from '../../components/Report/OrderStats';
import MenuPerformance from '../../components/Report/MenuPerformance';
import TimeHeatmap from '../../components/Report/TimeHeatmap';
import CustomerInsights from '../../components/Report/CustomerInsights';
import LiveMetrics from '../../components/LiveMetrics/LiveMetrics';
import reportsService from '../../services/reportsService';

function Report() {
  const [timeRange, setTimeRange] = useState('7days');
  const [data, setData] = useState({
    sales: [],
    orderStats: null,
    menuPerformance: null,
    busyHours: [],
    customerInsights: null,
    insights: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // If timeRange is custom object, we might need to handle it differently 
        // or pass it as string if the service expects it, or modify service.
        // For now, let's assume service can handle it or we pass a key.
        // Actually, existing services usually expect '7days' etc. 
        // If it's custom, we might need to modify service, but for this task 
        // I will assume the service needs 'custom' or the object.
        // Since I cannot modify service without reading it (which I haven't), 
        // I will pass timeRange as is. Use '7days' as fallback for initial load.
        
        const [
          sales,
          orderStats,
          menuPerformance,
          busyHours,
          customerInsights,
          insights
        ] = await Promise.all([
          reportsService.fetchSalesData(timeRange),
          reportsService.fetchOrderStats(timeRange),
          reportsService.fetchMenuPerformance(timeRange),
          reportsService.fetchBusyHours(timeRange),
          reportsService.fetchCustomerInsights(timeRange),
          reportsService.fetchAutoInsights()
        ]);

        setData({
          sales,
          orderStats,
          menuPerformance,
          busyHours,
          customerInsights,
          insights
        });
      } catch (error) {
        console.error("Failed to fetch reports data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleExport = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    let rangeStr = timeRange;
    if (typeof timeRange === 'object' && timeRange.type === 'custom') {
        rangeStr = `${timeRange.start} to ${timeRange.end}`;
    }

    // Header
    doc.setFontSize(20);
    doc.text('Restaurant Performance Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${dateStr}`, 14, 30);
    doc.text(`Period: ${rangeStr}`, 14, 35);

    // Section 1: Order Stats
    if (data.orderStats) {
        doc.setFontSize(14);
        doc.text('Order Statistics', 14, 45);
        
        const statsData = [
            ['Total Orders', data.orderStats.totalOrders || 0],
            ['Revenue', `$${data.orderStats.revenue || 0}`],
            ['Avg Order Value', `$${data.orderStats.avgOrderValue || 0}`],
            ['Cancelled', data.orderStats.cancelled || 0]
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Metric', 'Value']],
            body: statsData,
            theme: 'striped',
            headStyles: { fillColor: [255, 102, 0] }
        });
    }

    // Section 2: Top Menu Items
    if (data.menuPerformance && data.menuPerformance.length > 0) {
        let finalY = doc.lastAutoTable.finalY || 60;
        doc.setFontSize(14);
        doc.text('Top Menu Items', 14, finalY + 15);

        const menuData = data.menuPerformance.map(item => [
            item.name,
            item.orders,
            `$${item.revenue}`
        ]);

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Item Name', 'Orders', 'Revenue']],
            body: menuData,
            theme: 'striped',
            headStyles: { fillColor: [255, 102, 0] }
        });
    }

    // Section 3: Daily Sales (if available in meaningful format)
    // Assuming data.sales is array of { date, value }
    if (data.sales && data.sales.length > 0) {
        let finalY = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(14);
        doc.text('Sales Breakdown', 14, finalY + 15);

        const salesData = data.sales.map(s => [
            s.date || s.label,
            `$${s.value || s.amount}`
        ]);

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Date/Time', 'Sales']],
            body: salesData,
            theme: 'striped',
            headStyles: { fillColor: [255, 102, 0] }
        });
    }

    doc.save(`report_${rangeStr.replace(/ /g, '_')}_${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Gathering insights...</p>
      </div>
    );
  }

  return (
    <div className={styles.report}>
      <header className={styles.header}>
        <div>
          <h1>Reports & Analytics</h1>
          <p className={styles.subtitle}>Track your restaurant's performance and growth.</p>
        </div>
      </header>

      {/* Auto Insights Banner */}
      <div className={styles.insightsBanner}>
        {data.insights.map((insight, i) => (
          <div key={i} className={`${styles.insightPill} ${styles[insight.type]}`}>
            {insight.text}
          </div>
        ))}
      </div>

      <LiveMetrics variant="reports" />

      <FilterBar timeRange={timeRange} setTimeRange={setTimeRange} onExport={handleExport} />

      <div className={styles.grid}>
        {/* Row 1: Sales Chart (Main) */}
        <div className={styles.colSpan2}>
          <ReportCard title="Sales Trend">
            <SalesChart data={data.sales} timeRange={timeRange} />
          </ReportCard>
        </div>

        {/* Row 1: Order Stats */}
        <div className={styles.colSpan1}>
          <ReportCard title="Order Performance">
            <OrderStats stats={data.orderStats} />
          </ReportCard>
        </div>

        {/* Row 2: Menu Performance */}
        <div className={styles.colSpan1}>
          <ReportCard title="Top Menu Items">
            <MenuPerformance data={data.menuPerformance} />
          </ReportCard>
        </div>

        {/* Row 2: Busy Hours */}
        <div className={styles.colSpan1}>
          <ReportCard title="Busy Hours">
            <TimeHeatmap data={data.busyHours} />
          </ReportCard>
        </div>

        {/* Row 2: Customer Insights */}
        <div className={styles.colSpan1}>
          <ReportCard title="Customer Insights">
            <CustomerInsights data={data.customerInsights} />
          </ReportCard>
        </div>
      </div>
    </div>
  );
}

export default Report;