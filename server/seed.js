const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'library_db';

async function seedDatabase() {
  console.log('--- KHỞI TẠO VÀ NẠP DỮ LIỆU BAN ĐẦU CHO HỆ THỐNG QUẢN LÝ THƯ VIỆN ---');

  // Step 1: Connect to MySQL server and ensure DB exists
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(`✓ Đã kết nối thành công đến MySQL Server tại ${dbConfig.host}:${dbConfig.port}`);

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✓ Đã kiểm tra và tạo cơ sở dữ liệu \`${DB_NAME}\``);
    await connection.changeUser({ database: DB_NAME });
  } catch (err) {
    console.error('✗ Lỗi kết nối cơ sở dữ liệu:', err.message);
    process.exit(1);
  }

  try {
    // Step 2: Run schema.sql
    const schemaPath = path.join(__dirname, 'config', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('✓ Đã khởi tạo cấu trúc bảng từ schema.sql');
    }

    // Step 3: Seed Roles
    const roles = ['ADMIN', 'LIBRARIAN', 'BORROWER'];
    const roleMap = {};
    for (const roleName of roles) {
      await connection.query(
        'INSERT INTO roles (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name',
        [roleName]
      );
      const [rows] = await connection.query('SELECT id FROM roles WHERE name = ?', [roleName]);
      roleMap[roleName] = rows[0].id;
    }
    console.log('✓ Đã nạp danh sách vai trò:', roleMap);

    // Step 4: Seed Users
    const salt = await bcrypt.genSalt(10);
    const users = [
      {
        username: 'admin',
        password_hash: await bcrypt.hash('admin123', salt),
        full_name: 'Quản Trị Viên Hệ Thống',
        email: 'admin@library.vn',
        phone: '0901234567',
        role_id: roleMap['ADMIN'],
        status: 'ACTIVE'
      },
      {
        username: 'librarian',
        password_hash: await bcrypt.hash('lib123', salt),
        full_name: 'Thủ Thư Nguyễn Văn An',
        email: 'librarian@library.vn',
        phone: '0912345678',
        role_id: roleMap['LIBRARIAN'],
        status: 'ACTIVE'
      },
      {
        username: '523100126',
        password_hash: await bcrypt.hash('pass123', salt),
        full_name: 'Hà Tuấn Việt',
        email: '523100126@student.tdtu.edu.vn',
        phone: '0923456781',
        role_id: roleMap['BORROWER'],
        status: 'ACTIVE'
      },
      {
        username: '523100127',
        password_hash: await bcrypt.hash('pass123', salt),
        full_name: 'Nguyễn Thị Mai',
        email: '523100127@student.tdtu.edu.vn',
        phone: '0923456782',
        role_id: roleMap['BORROWER'],
        status: 'ACTIVE'
      },
      {
        username: '523100128',
        password_hash: await bcrypt.hash('pass123', salt),
        full_name: 'Trần Văn Nam',
        email: '523100128@student.tdtu.edu.vn',
        phone: '0923456783',
        role_id: roleMap['BORROWER'],
        status: 'ACTIVE'
      }
    ];

    const userMap = {};
    for (const u of users) {
      await connection.query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role_id = VALUES(role_id)`,
        [u.username, u.password_hash, u.full_name, u.email, u.phone, u.role_id, u.status]
      );
      const [uRows] = await connection.query('SELECT id FROM users WHERE username = ?', [u.username]);
      userMap[u.username] = uRows[0].id;
    }
    console.log('✓ Đã tạo các tài khoản người dùng: admin, librarian, 523100126, 523100127, 523100128');

    // Step 5: Reader Cards for Borrowers
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const borrowerCards = [
      { username: '523100126', card_number: 'CARD-523100126' },
      { username: '523100127', card_number: 'CARD-523100127' },
      { username: '523100128', card_number: 'CARD-523100128' }
    ];

    for (const c of borrowerCards) {
      const uid = userMap[c.username];
      await connection.query(
        `INSERT INTO reader_cards (user_id, card_number, issued_date, expire_date, status, max_borrow)
         VALUES (?, ?, ?, ?, 'ACTIVE', 5)
         ON DUPLICATE KEY UPDATE status = 'ACTIVE', max_borrow = 5`,
        [uid, c.card_number, today, nextYear]
      );
    }
    console.log('✓ Đã cấp thẻ thư viện cho các độc giả');

    // Step 6: Seed Categories (6 categories)
    const categories = [
      { code: 'CNTT', name: 'Công nghệ thông tin', description: 'Sách về khoa học máy tính, lập trình, trí tuệ nhân tạo và an toàn thông tin' },
      { code: 'KHTN', name: 'Khoa học tự nhiên', description: 'Toán học, vật lý, hóa học, sinh học và khoa học ứng dụng' },
      { code: 'VH', name: 'Văn học - Nghệ thuật', description: 'Tiểu thuyết, truyện ngắn, thơ ca và các tác phẩm văn học kinh điển' },
      { code: 'KT', name: 'Kinh tế - Quản trị', description: 'Kinh tế học, tài chính doanh nghiệp, quản trị kinh doanh, marketing' },
      { code: 'NN', name: 'Ngoại ngữ', description: 'Tài liệu học tiếng Anh, tiếng Nhật, tiếng Trung, tiếng Pháp' },
      { code: 'LS', name: 'Lịch sử - Địa lý', description: 'Lịch sử Việt Nam, lịch sử thế giới, địa lý và văn hóa vùng miền' }
    ];

    const categoryMap = {};
    for (const cat of categories) {
      await connection.query(
        `INSERT INTO categories (code, name, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
        [cat.code, cat.name, cat.description]
      );
      const [cRows] = await connection.query('SELECT id FROM categories WHERE code = ?', [cat.code]);
      categoryMap[cat.code] = cRows[0].id;
    }
    console.log('✓ Đã tạo 6 thể loại sách: CNTT, KHTN, VH, KT, NN, LS');

    // Step 7: Seed Authors (5 authors)
    const authors = [
      { code: 'TG-01', name: 'Nguyễn Nhật Ánh', bio: 'Nhà văn Việt Nam nổi tiếng với nhiều tác phẩm gắn liền với tuổi thơ và học trò' },
      { code: 'TG-02', name: 'Robert C. Martin (Uncle Bob)', bio: 'Chuyên gia công nghệ phần mềm, đồng tác giả Tuyên ngôn Agile và Clean Code' },
      { code: 'TG-03', name: 'Yuval Noah Harari', bio: 'Nhà sử học, triết gia người Israel, tác giả các cuốn sách nghiên cứu lịch sử loài người' },
      { code: 'TG-04', name: 'Phạm Huy Hoàng', bio: 'Kỹ sư phần mềm, tác giả cuốn Tôi Đi Code Dạo' },
      { code: 'TG-05', name: 'Nguyễn Du', bio: 'Đại thi hào dân tộc Việt Nam, Danh nhân văn hóa thế giới' }
    ];

    const authorMap = {};
    for (const a of authors) {
      await connection.query(
        `INSERT INTO authors (code, name, bio)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), bio = VALUES(bio)`,
        [a.code, a.name, a.bio]
      );
      const [aRows] = await connection.query('SELECT id FROM authors WHERE code = ?', [a.code]);
      authorMap[a.code] = aRows[0].id;
    }
    console.log('✓ Đã tạo 5 tác giả');

    // Step 8: Seed Shelves (10 shelves)
    const shelves = [
      { shelf_code: 'KE-K01', location: 'Kệ K01 - Dãy A - Tầng 1 (Khu CNTT)', capacity: 50 },
      { shelf_code: 'KE-K02', location: 'Kệ K02 - Dãy A - Tầng 1 (Khu CNTT)', capacity: 50 },
      { shelf_code: 'KE-K03', location: 'Kệ K03 - Dãy B - Tầng 1 (Khu KHTN)', capacity: 50 },
      { shelf_code: 'KE-K04', location: 'Kệ K04 - Dãy B - Tầng 1 (Khu KHTN)', capacity: 50 },
      { shelf_code: 'KE-K05', location: 'Kệ K05 - Dãy C - Tầng 2 (Khu Văn Học)', capacity: 50 },
      { shelf_code: 'KE-K06', location: 'Kệ K06 - Dãy C - Tầng 2 (Khu Văn Học)', capacity: 50 },
      { shelf_code: 'KE-K07', location: 'Kệ K07 - Dãy D - Tầng 2 (Khu Kinh Tế)', capacity: 50 },
      { shelf_code: 'KE-K08', location: 'Kệ K08 - Dãy D - Tầng 2 (Khu Kinh Tế)', capacity: 50 },
      { shelf_code: 'KE-K09', location: 'Kệ K09 - Dãy E - Tầng 3 (Khu Ngoại Ngữ)', capacity: 50 },
      { shelf_code: 'KE-K10', location: 'Kệ K10 - Dãy F - Tầng 3 (Khu Lịch Sử)', capacity: 50 }
    ];

    const shelfMap = {};
    for (const s of shelves) {
      await connection.query(
        `INSERT INTO shelves (shelf_code, location, capacity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE location = VALUES(location), capacity = VALUES(capacity)`,
        [s.shelf_code, s.location, s.capacity]
      );
      const [sRows] = await connection.query('SELECT id FROM shelves WHERE shelf_code = ?', [s.shelf_code]);
      shelfMap[s.shelf_code] = sRows[0].id;
    }
    console.log('✓ Đã tạo 10 kệ sách: KE-K01 đến KE-K10');

    // Step 9: Seed 10 Books with Vietnamese titles
    const books = [
      {
        code: 'BOOK-001',
        isbn: '978-604-01-001',
        title: 'Clean Code - Mã Sạch và Nghệ Thuật Lập Trình',
        author_id: authorMap['TG-02'],
        category_id: categoryMap['CNTT'],
        publisher: 'NXB Thông tin và Truyền thông',
        publish_year: 2021,
        max_borrow_days: 14,
        cover_image: null
      },
      {
        code: 'BOOK-002',
        isbn: '978-604-01-002',
        title: 'Tôi Đi Code Dạo - Dạo Bước Trong Thế Giới Lập Trình',
        author_id: authorMap['TG-04'],
        category_id: categoryMap['CNTT'],
        publisher: 'NXB Dân Trí',
        publish_year: 2020,
        max_borrow_days: 14,
        cover_image: null
      },
      {
        code: 'BOOK-003',
        isbn: '978-604-01-003',
        title: 'Mắt Biếc',
        author_id: authorMap['TG-01'],
        category_id: categoryMap['VH'],
        publisher: 'NXB Trẻ',
        publish_year: 2019,
        max_borrow_days: 10,
        cover_image: null
      },
      {
        code: 'BOOK-004',
        isbn: '978-604-01-004',
        title: 'Cho Tôi Xin Một Vé Đi Tuổi Thơ',
        author_id: authorMap['TG-01'],
        category_id: categoryMap['VH'],
        publisher: 'NXB Trẻ',
        publish_year: 2018,
        max_borrow_days: 10,
        cover_image: null
      },
      {
        code: 'BOOK-005',
        isbn: '978-604-01-005',
        title: 'Sapiens - Lược Sử Loài Người',
        author_id: authorMap['TG-03'],
        category_id: categoryMap['LS'],
        publisher: 'NXB Tri Thức',
        publish_year: 2017,
        max_borrow_days: 21,
        cover_image: null
      },
      {
        code: 'BOOK-006',
        isbn: '978-604-01-006',
        title: 'Homo Deus - Lược Sử Tương Lai',
        author_id: authorMap['TG-03'],
        category_id: categoryMap['LS'],
        publisher: 'NXB Tri Thức',
        publish_year: 2019,
        max_borrow_days: 21,
        cover_image: null
      },
      {
        code: 'BOOK-007',
        isbn: '978-604-01-007',
        title: 'Truyện Kiều - Ấn Bản Khảo Đính Ngữ Nghĩa',
        author_id: authorMap['TG-05'],
        category_id: categoryMap['VH'],
        publisher: 'NXB Văn Học',
        publish_year: 2022,
        max_borrow_days: 14,
        cover_image: null
      },
      {
        code: 'BOOK-008',
        isbn: '978-604-01-008',
        title: 'Cấu Trúc Dữ Liệu Và Giải Thuật Cơ Bản',
        author_id: authorMap['TG-02'],
        category_id: categoryMap['CNTT'],
        publisher: 'NXB Giáo Dục Việt Nam',
        publish_year: 2021,
        max_borrow_days: 14,
        cover_image: null
      },
      {
        code: 'BOOK-009',
        isbn: '978-604-01-009',
        title: 'Kinh Tế Học Vi Mô Cơ Bản',
        author_id: authorMap['TG-03'],
        category_id: categoryMap['KT'],
        publisher: 'NXB Kinh Tế Quốc Dân',
        publish_year: 2020,
        max_borrow_days: 14,
        cover_image: null
      },
      {
        code: 'BOOK-010',
        isbn: '978-604-01-010',
        title: 'Ngữ Pháp Tiếng Anh Hiện Đại Dành Cho Sinh Viên',
        author_id: authorMap['TG-04'],
        category_id: categoryMap['NN'],
        publisher: 'NXB Đại Học Quốc Gia TP.HCM',
        publish_year: 2022,
        max_borrow_days: 14,
        cover_image: null
      }
    ];

    const bookMap = {};
    for (const b of books) {
      await connection.query(
        `INSERT INTO books (code, isbn, title, author_id, category_id, publisher, publish_year, max_borrow_days, cover_image, status, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 1)
         ON DUPLICATE KEY UPDATE title = VALUES(title), author_id = VALUES(author_id), category_id = VALUES(category_id)`,
        [b.code, b.isbn, b.title, b.author_id, b.category_id, b.publisher, b.publish_year, b.max_borrow_days, b.cover_image]
      );
      const [bRows] = await connection.query('SELECT id FROM books WHERE code = ?', [b.code]);
      bookMap[b.code] = bRows[0].id;
    }
    console.log('✓ Đã tạo 10 đầu sách tiếng Việt');

    // Step 10: Seed 20 Book Copies distributed across shelves
    const shelfList = Object.values(shelfMap);
    const copies = [];

    // Each book has 2 copies: CP-BOOK-001-01, CP-BOOK-001-02
    books.forEach((book, bIndex) => {
      const shelf1 = shelfList[bIndex % shelfList.length];
      const shelf2 = shelfList[(bIndex + 1) % shelfList.length];

      copies.push({
        book_id: bookMap[book.code],
        shelf_id: shelf1,
        copy_code: `CP-${book.code}-01`,
        condition_note: 'Sách mới 100%'
      });

      copies.push({
        book_id: bookMap[book.code],
        shelf_id: shelf2,
        copy_code: `CP-${book.code}-02`,
        condition_note: 'Sách mới 95%, tình trạng tốt'
      });
    });

    for (const cp of copies) {
      await connection.query(
        `INSERT INTO book_copies (book_id, shelf_id, copy_code, status, condition_note)
         VALUES (?, ?, ?, 'AVAILABLE', ?)
         ON DUPLICATE KEY UPDATE shelf_id = VALUES(shelf_id), status = 'AVAILABLE'`,
        [cp.book_id, cp.shelf_id, cp.copy_code, cp.condition_note]
      );
    }
    console.log(`✓ Đã tạo ${copies.length} bản sao sách (book_copies) phân bố đều trên các kệ`);

    // Step 11: Update book available_copies and total_copies
    await connection.query(`
      UPDATE books b SET
        total_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id),
        available_copies = (SELECT COUNT(id) FROM book_copies WHERE book_id = b.id AND status = 'AVAILABLE')
    `);
    console.log('✓ Đã cập nhật số lượng tồn kho (total_copies & available_copies) cho tất cả sách');

    console.log('\n======================================================');
    console.log(' NẠP DỮ LIỆU SEED HOÀN TẤT THÀNH CÔNG!');
    console.log(' Tài khoản quản trị:');
    console.log('   - ADMIN:     admin / admin123');
    console.log('   - THỦ THƯ:   librarian / lib123');
    console.log('   - ĐỘC GIẢ 1: 523100126 / pass123 (Hà Tuấn Việt)');
    console.log('   - ĐỘC GIẢ 2: 523100127 / pass123 (Nguyễn Thị Mai)');
    console.log('   - ĐỘC GIẢ 3: 523100128 / pass123 (Trần Văn Nam)');
    console.log('======================================================\n');
  } catch (error) {
    console.error('✗ Lỗi trong quá trình nạp dữ liệu:', error);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
