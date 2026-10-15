const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pool = require('../config/database');

const reportController = {
  /**
   * Thống kê tổng quan (Tháng/Năm)
   * GET /api/v1/reports/statistics
   */
  async getStatistics(req, res) {
    try {
      const { year, month } = req.query;
      const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
      const currentMonth = month ? parseInt(month, 10) : null;

      let dateFilter = 'YEAR(bt.created_at) = ?';
      let dateParams = [currentYear];

      if (currentMonth) {
        dateFilter += ' AND MONTH(bt.created_at) = ?';
        dateParams.push(currentMonth);
      }

      // 1. Total borrows
      const [borrowStats] = await pool.query(
        `SELECT
           COUNT(bt.id) AS total_tickets,
           SUM(CASE WHEN bt.status IN ('BORROWED', 'RETURNED') THEN 1 ELSE 0 END) AS total_borrows,
           SUM(CASE WHEN bt.status = 'RETURNED' THEN 1 ELSE 0 END) AS total_returns
         FROM borrow_tickets bt
         WHERE ${dateFilter}`,
        dateParams
      );

      // 2. Currently overdue count
      const [overdueStats] = await pool.query(
        `SELECT COUNT(id) AS overdue_count
         FROM borrow_tickets
         WHERE status = 'BORROWED' AND due_date < NOW()`
      );

      // 3. Fine revenue
      let fineFilter = 'YEAR(paid_at) = ?';
      let fineParams = [currentYear];
      if (currentMonth) {
        fineFilter += ' AND MONTH(paid_at) = ?';
        fineParams.push(currentMonth);
      }

      const [revenueStats] = await pool.query(
        `SELECT
           COALESCE(SUM(amount), 0) AS fine_revenue,
           COUNT(id) AS payment_count
         FROM payments
         WHERE ${fineFilter}`,
        fineParams
      );

      // 4. Borrows by category
      const [categoryBorrows] = await pool.query(
        `SELECT c.id, c.code, c.name, COUNT(td.id) AS borrow_count
         FROM categories c
         LEFT JOIN books b ON b.category_id = c.id
         LEFT JOIN book_copies bc ON bc.book_id = b.id
         LEFT JOIN ticket_details td ON td.copy_id = bc.id
         LEFT JOIN borrow_tickets bt ON td.ticket_id = bt.id AND (${dateFilter})
         GROUP BY c.id
         ORDER BY borrow_count DESC`,
        dateParams
      );

      // 5. System totals
      const [totalBooks] = await pool.query("SELECT COUNT(id) AS count, COALESCE(SUM(total_copies), 0) AS total_copies, COALESCE(SUM(available_copies), 0) AS available_copies FROM books WHERE status = 'ACTIVE'");
      const [totalUsers] = await pool.query("SELECT COUNT(id) AS count FROM users WHERE status = 'ACTIVE'");
      const [activeCards] = await pool.query("SELECT COUNT(id) AS count FROM reader_cards WHERE status = 'ACTIVE'");

      return res.status(200).json({
        success: true,
        data: {
          period: {
            year: currentYear,
            month: currentMonth || 'Tất cả'
          },
          summary: {
            total_borrows: parseInt(borrowStats[0].total_borrows || 0, 10),
            total_returns: parseInt(borrowStats[0].total_returns || 0, 10),
            overdue_count: parseInt(overdueStats[0].overdue_count || 0, 10),
            fine_revenue: parseFloat(revenueStats[0].fine_revenue || 0),
            total_books: totalBooks[0].count,
            total_copies: totalBooks[0].total_copies,
            available_copies: totalBooks[0].available_copies,
            total_users: totalUsers[0].count,
            active_cards: activeCards[0].count
          },
          borrows_by_category: categoryBorrows
        }
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy báo cáo thống kê',
        error: error.message
      });
    }
  },

  /**
   * Danh sách phiếu mượn quá hạn
   * GET /api/v1/reports/overdue
   */
  async getOverdueTickets(req, res) {
    try {
      const [rows] = await pool.query(
        `SELECT
           bt.id, bt.ticket_code, bt.created_at, bt.due_date,
           DATEDIFF(NOW(), bt.due_date) AS overdue_days,
           rc.card_number,
           u.id AS user_id, u.full_name AS borrower_name, u.email, u.phone,
           (
             SELECT COUNT(id) FROM ticket_details WHERE ticket_id = bt.id
           ) AS book_count,
           (
             DATEDIFF(NOW(), bt.due_date) * (SELECT COUNT(id) FROM ticket_details WHERE ticket_id = bt.id) * 5000
           ) AS estimated_fine
         FROM borrow_tickets bt
         JOIN reader_cards rc ON bt.reader_card_id = rc.id
         JOIN users u ON rc.user_id = u.id
         WHERE bt.status = 'BORROWED' AND bt.due_date < NOW()
         ORDER BY bt.due_date ASC`
      );

      return res.status(200).json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Get overdue tickets error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách sách quá hạn',
        error: error.message
      });
    }
  },

  /**
   * Xuất báo cáo Excel
   * GET /api/v1/reports/export/excel
   */
  async exportExcel(req, res) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Tuanvietlibrary';
      workbook.created = new Date();

      // Sheet 1: Borrow Tickets
      const ticketSheet = workbook.addWorksheet('Phiếu Mượn Trả');
      ticketSheet.columns = [
        { header: 'Mã Phiếu', key: 'ticket_code', width: 20 },
        { header: 'Số Thẻ Độc Giả', key: 'card_number', width: 18 },
        { header: 'Tên Độc Giả', key: 'borrower_name', width: 25 },
        { header: 'Số Điện Thoại', key: 'phone', width: 15 },
        { header: 'Ngày Mượn', key: 'created_at', width: 20 },
        { header: 'Hạn Trả', key: 'due_date', width: 20 },
        { header: 'Ngày Trả', key: 'return_date', width: 20 },
        { header: 'Trạng Thái', key: 'status', width: 15 },
        { header: 'Số Lượng Sách', key: 'book_count', width: 15 }
      ];

      const [tickets] = await pool.query(
        `SELECT bt.ticket_code, rc.card_number, u.full_name AS borrower_name, u.phone,
                bt.created_at, bt.due_date, bt.return_date, bt.status,
                (SELECT COUNT(id) FROM ticket_details WHERE ticket_id = bt.id) AS book_count
         FROM borrow_tickets bt
         JOIN reader_cards rc ON bt.reader_card_id = rc.id
         JOIN users u ON rc.user_id = u.id
         ORDER BY bt.id DESC LIMIT 1000`
      );

      tickets.forEach(ticket => {
        ticketSheet.addRow(ticket);
      });

      // Sheet 2: Overdue Tickets
      const overdueSheet = workbook.addWorksheet('Danh Sách Quá Hạn');
      overdueSheet.columns = [
        { header: 'Mã Phiếu', key: 'ticket_code', width: 20 },
        { header: 'Độc Giả', key: 'borrower_name', width: 25 },
        { header: 'Điện Thoại', key: 'phone', width: 15 },
        { header: 'Hạn Trả', key: 'due_date', width: 20 },
        { header: 'Số Ngày Quá Hạn', key: 'overdue_days', width: 18 },
        { header: 'Tiền Phạt Dự Kiến (VND)', key: 'estimated_fine', width: 22 }
      ];

      const [overdues] = await pool.query(
        `SELECT bt.ticket_code, u.full_name AS borrower_name, u.phone, bt.due_date,
                DATEDIFF(NOW(), bt.due_date) AS overdue_days,
                (DATEDIFF(NOW(), bt.due_date) * (SELECT COUNT(id) FROM ticket_details WHERE ticket_id = bt.id) * 5000) AS estimated_fine
         FROM borrow_tickets bt
         JOIN reader_cards rc ON bt.reader_card_id = rc.id
         JOIN users u ON rc.user_id = u.id
         WHERE bt.status = 'BORROWED' AND bt.due_date < NOW()
         ORDER BY bt.due_date ASC`
      );

      overdues.forEach(o => {
        overdueSheet.addRow(o);
      });

      // Sheet 3: Payments
      const paymentSheet = workbook.addWorksheet('Doanh Thu Phạt');
      paymentSheet.columns = [
        { header: 'Mã Thanh Toán', key: 'id', width: 15 },
        { header: 'Mã Phiếu', key: 'ticket_code', width: 20 },
        { header: 'Độc Giả', key: 'borrower_name', width: 25 },
        { header: 'Số Tiền (VND)', key: 'amount', width: 18 },
        { header: 'Phương Thức', key: 'payment_method', width: 18 },
        { header: 'Thời Gian', key: 'paid_at', width: 20 }
      ];

      const [payments] = await pool.query(
        `SELECT p.id, bt.ticket_code, u.full_name AS borrower_name, p.amount, p.payment_method, p.paid_at
         FROM payments p
         JOIN fines f ON p.fine_id = f.id
         JOIN borrow_tickets bt ON f.ticket_id = bt.id
         JOIN reader_cards rc ON bt.reader_card_id = rc.id
         JOIN users u ON rc.user_id = u.id
         ORDER BY p.id DESC`
      );

      payments.forEach(p => {
        paymentSheet.addRow(p);
      });

      // Header row styling
      [ticketSheet, overdueSheet, paymentSheet].forEach(sheet => {
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E88E5' }
        };
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Bao-cao-thu-vien-${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Export Excel error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xuất file Excel',
        error: error.message
      });
    }
  },

  /**
   * Xuất báo cáo PDF
   * GET /api/v1/reports/export/pdf
   */
  async exportPdf(req, res) {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Bao-cao-thu-vien-${Date.now()}.pdf`
      );

      doc.pipe(res);

      // Title
      doc.fontSize(20).text('BAO CAO THU VIEN TUANVIETLIBRARY', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Ngay xuat: ${new Date().toLocaleString('vi-VN')}`, { align: 'center' });
      doc.moveDown(1.5);

      // Fetch summary statistics
      const [borrowCount] = await pool.query("SELECT COUNT(id) AS c FROM borrow_tickets WHERE status = 'BORROWED'");
      const [returnedCount] = await pool.query("SELECT COUNT(id) AS c FROM borrow_tickets WHERE status = 'RETURNED'");
      const [overdueCount] = await pool.query("SELECT COUNT(id) AS c FROM borrow_tickets WHERE status = 'BORROWED' AND due_date < NOW()");
      const [fineTotal] = await pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments");
      const [bookTotal] = await pool.query("SELECT COUNT(id) AS total_titles, COALESCE(SUM(total_copies), 0) AS total_copies FROM books WHERE status = 'ACTIVE'");

      doc.fontSize(14).text('1. TONG QUAN HE THONG');
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`- Tong so dau sach hoat dong: ${bookTotal[0].total_titles}`);
      doc.text(`- Tong so ban sao sach: ${bookTotal[0].total_copies}`);
      doc.text(`- So luot sach dang muon: ${borrowCount[0].c}`);
      doc.text(`- So luot sach da tra: ${returnedCount[0].c}`);
      doc.text(`- So luot qua han hien tai: ${overdueCount[0].c}`);
      doc.text(`- Tong thu tien phat: ${Number(fineTotal[0].total).toLocaleString('vi-VN')} VND`);
      doc.moveDown(1.5);

      // Overdue list
      doc.fontSize(14).text('2. DANH SACH PHIEU MUON QUA HAN');
      doc.moveDown(0.5);

      const [overdues] = await pool.query(
        `SELECT bt.ticket_code, u.full_name AS borrower_name, u.phone, bt.due_date,
                DATEDIFF(NOW(), bt.due_date) AS overdue_days
         FROM borrow_tickets bt
         JOIN reader_cards rc ON bt.reader_card_id = rc.id
         JOIN users u ON rc.user_id = u.id
         WHERE bt.status = 'BORROWED' AND bt.due_date < NOW()
         ORDER BY bt.due_date ASC LIMIT 10`
      );

      if (overdues.length === 0) {
        doc.fontSize(10).text('Khong co phieu muon nao qua han.');
      } else {
        doc.fontSize(10);
        overdues.forEach((item, index) => {
          doc.text(
            `${index + 1}. Ma phieu: ${item.ticket_code} | Doc gia: ${item.borrower_name} | SDT: ${item.phone || 'N/A'} | Han tra: ${item.due_date} | Qua han: ${item.overdue_days} ngay`
          );
        });
      }

      doc.end();
    } catch (error) {
      console.error('Export PDF error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi xuất file PDF',
        error: error.message
      });
    }
  }
};

module.exports = reportController;
