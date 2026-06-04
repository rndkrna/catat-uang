import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  createdAt: string;
}

export const exportToExcel = async (transactions: Transaction[], userName: string = 'User') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan Transaksi');

  worksheet.columns = [
    { header: 'Tanggal', key: 'date', width: 22 },
    { header: 'Kategori', key: 'category', width: 25 },
    { header: 'Keterangan', key: 'description', width: 40 },
    { header: 'Tipe', key: 'type', width: 15 },
    { header: 'Nominal', key: 'amount', width: 20 }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF97316' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  transactions.forEach(t => {
    const row = worksheet.addRow({
      date: new Date(t.createdAt).toLocaleString('id-ID'),
      category: t.category,
      description: t.description || '-',
      type: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      amount: t.amount
    });

    const amountCell = row.getCell('amount');
    amountCell.numFmt = '"Rp"#,##0';
    if (t.type === 'income') {
      amountCell.font = { color: { argb: 'FF16A34A' }, bold: true };
    } else {
      amountCell.font = { color: { argb: 'FFDC2626' }, bold: true };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Laporan_Keuangan_${userName.replace(/\s+/g, '_')}.xlsx`);
};

export const exportToPDF = (transactions: Transaction[], userName: string = 'User') => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.setTextColor(249, 115, 22);
  doc.text('Laporan Keuangan', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Nama: ${userName}`, 14, 30);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 36);

  const tableData = transactions.map(t => [
    new Date(t.createdAt).toLocaleString('id-ID'),
    t.category,
    t.description || '-',
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    `Rp ${new Intl.NumberFormat('id-ID').format(t.amount)}`
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Tanggal', 'Kategori', 'Keterangan', 'Tipe', 'Nominal']],
    body: tableData,
    headStyles: { fillColor: [249, 115, 22] },
    styles: { font: 'helvetica', fontSize: 9 },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 4) {
        // @ts-ignore
        const type = data.row.raw[3];
        if (type === 'Pemasukan') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  doc.save(`Laporan_Keuangan_${userName.replace(/\s+/g, '_')}.pdf`);
};
