import { useState, useEffect } from 'react';
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
        const [
          sales,
          orderStats,
          menuPerformance,
          busyHours,
          customerInsights,
          insights
        ] = await Promise.all([
          reportsService.fetchSalesData(timeRange),
          reportsService.fetchOrderStats(),
          reportsService.fetchMenuPerformance(),
          reportsService.fetchBusyHours(),
          reportsService.fetchCustomerInsights(),
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

      <FilterBar timeRange={timeRange} setTimeRange={setTimeRange} />

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