import { SlideCanvas } from './components/SlideCanvas';
import type { Slide } from './types/slide';
import './App.css';

const demoSlide: Slide = {
  id: 'demo-1',
  title: 'Q1 2026 Financial Overview',
  backgroundColor: '#0f172a',
  blocks: [
    {
      id: 'title-1',
      type: 'text',
      x: 40,
      y: 20,
      width: 800,
      height: 60,
      content: 'Q1 2026 – Financial Overview',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#f1f5f9',
    },
    {
      id: 'kpi-1',
      type: 'kpi',
      x: 40,
      y: 100,
      width: 200,
      height: 110,
      label: 'Revenue',
      value: 4_820_000,
      unit: '€',
      trend: 12.4,
    },
    {
      id: 'kpi-2',
      type: 'kpi',
      x: 260,
      y: 100,
      width: 200,
      height: 110,
      label: 'EBITDA',
      value: 1_236_000,
      unit: '€',
      trend: -3.1,
    },
    {
      id: 'kpi-3',
      type: 'kpi',
      x: 480,
      y: 100,
      width: 200,
      height: 110,
      label: 'Customers',
      value: 3_412,
      trend: 8.9,
    },
    {
      id: 'chart-1',
      type: 'chart',
      x: 40,
      y: 230,
      width: 640,
      height: 440,
      chartType: 'bar',
      title: 'Monthly Revenue vs. Budget',
      xKey: 'month',
      yKeys: ['revenue', 'budget'],
      data: [
        { month: 'Jan', revenue: 1_500_000, budget: 1_400_000 },
        { month: 'Feb', revenue: 1_620_000, budget: 1_500_000 },
        { month: 'Mar', revenue: 1_700_000, budget: 1_600_000 },
      ],
    },
    {
      id: 'table-1',
      type: 'table',
      x: 700,
      y: 100,
      width: 540,
      height: 570,
      title: 'Top Products',
      columns: [
        { key: 'product', header: 'Product' },
        { key: 'revenue', header: 'Revenue (€)', align: 'right' },
        { key: 'growth', header: 'Growth', align: 'right' },
      ],
      rows: [
        { product: 'Product A', revenue: '1,820,000', growth: '+14%' },
        { product: 'Product B', revenue: '1,240,000', growth: '+9%' },
        { product: 'Product C', revenue: '980,000', growth: '-2%' },
        { product: 'Product D', revenue: '780,000', growth: '+22%' },
      ],
    },
  ],
};

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <SlideCanvas slide={demoSlide} scale={0.75} />
    </div>
  );
}

export default App;
