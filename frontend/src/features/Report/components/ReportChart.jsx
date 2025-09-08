import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReportChart = ({ filteredReports, isLoading }) => {
  const chartData = useMemo(() => {
    // ... (logika chartData Anda tetap sama, tidak perlu diubah)
    if (filteredReports.length === 0) {
      return { labels: [], datasets: [] };
    }

    const dates = filteredReports.map((r) => new Date(r.reported_date));
    const minDate = new Date(Math.min.apply(null, dates));
    const maxDate = new Date(Math.max.apply(null, dates));
    const monthDifference = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth());

    let labels = [];
    let dataValues = [];
    let aggregationLevel = "monthly";

    if (monthDifference > 24) {
      aggregationLevel = "yearly";
      const yearlyCounts = {};
      filteredReports.forEach((report) => {
        const year = new Date(report.reported_date).getFullYear();
        yearlyCounts[year] = (yearlyCounts[year] || 0) + 1;
      });
      const sortedYears = Object.keys(yearlyCounts).sort();
      labels = sortedYears;
      dataValues = sortedYears.map((year) => yearlyCounts[year]);
    } else {
      const monthlyCounts = {};
      filteredReports.forEach((report) => {
        const date = new Date(report.reported_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
      });
      const sortedKeys = Object.keys(monthlyCounts).sort();
      labels = sortedKeys.map((key) => {
        const [year, month] = key.split("-");
        return new Date(year, month - 1).toLocaleString("id-ID", { month: "long", year: "numeric" });
      });
      dataValues = sortedKeys.map((key) => monthlyCounts[key]);
    }

    return {
      labels,
      datasets: [{
        label: `Tiket Selesai per ${aggregationLevel === "monthly" ? "Bulan" : "Tahun"}`,
        data: dataValues,
        backgroundColor: "rgba(229, 30, 37, 0.6)",
        borderColor: "rgba(229, 30, 37, 1)",
        borderWidth: 1,
      }],
    };
  }, [filteredReports]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // <-- TAMBAHKAN BARIS INI
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Tren Tiket Selesai", font: { size: 18 } },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  return (
    <div className="chart-container">
      {filteredReports.length > 0 ? (
        <Bar options={chartOptions} data={chartData} />
      ) : (
        !isLoading && <p className="no-data">Tidak ada data untuk ditampilkan pada rentang waktu ini.</p>
      )}
    </div>
  );
};

export default ReportChart;