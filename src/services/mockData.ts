import { Book, Author, Category, Shelf, BookCopy, BorrowTicket, Fine, ReaderCard, User, AuditLog, Statistics } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    fullName: 'Trần Văn Quản Trị',
    email: 'admin@thuvien.edu.vn',
    phone: '0901234567',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'user-lib',
    username: 'librarian',
    fullName: 'Nguyễn Thị Thủ Thư',
    email: 'thuthu@thuvien.edu.vn',
    phone: '0912345678',
    role: 'LIBRARIAN',
    status: 'ACTIVE',
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'user-borrower',
    username: 'borrower',
    fullName: 'Lê Hoàng Độc Giả',
    email: 'docgia@sinhvien.edu.vn',
    phone: '0923456789',
    role: 'BORROWER',
    status: 'ACTIVE',
    readerCardId: 'card-001',
    createdAt: '2024-03-10T09:30:00Z',
  },
  {
    id: 'user-borrower-2',
    username: 'sv2024',
    fullName: 'Phạm Thuỳ Trang',
    email: 'thuytrang@sinhvien.edu.vn',
    phone: '0934567890',
    role: 'BORROWER',
    status: 'ACTIVE',
    readerCardId: 'card-002',
    createdAt: '2024-04-12T14:15:00Z',
  }
];

export const mockReaderCards: ReaderCard[] = [
  {
    id: 'card-001',
    cardNumber: 'DG-2024-001',
    userId: 'user-borrower',
    userFullName: 'Lê Hoàng Độc Giả',
    issueDate: '2024-03-10',
    expiryDate: '2026-03-10',
    status: 'ACTIVE',
    maxBorrowLimit: 5,
    currentBorrowCount: 2,
  },
  {
    id: 'card-002',
    cardNumber: 'DG-2024-002',
    userId: 'user-borrower-2',
    userFullName: 'Phạm Thuỳ Trang',
    issueDate: '2024-04-12',
    expiryDate: '2026-04-12',
    status: 'ACTIVE',
    maxBorrowLimit: 5,
    currentBorrowCount: 1,
  }
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Công nghệ thông tin & Lập trình', code: 'CNTT', description: 'Sách chuyên ngành phần mềm, AI, mạng máy tính', bookCount: 30 },
  { id: 'cat-2', name: 'Văn học & Nghệ thuật', code: 'VHNT', description: 'Tiểu thuyết, truyện ngắn, thơ ca Việt Nam và thế giới', bookCount: 45 },
  { id: 'cat-3', name: 'Kinh tế & Quản trị kinh doanh', code: 'KTQT', description: 'Tài chính, marketing, quản lý và khởi nghiệp', bookCount: 35 },
  { id: 'cat-4', name: 'Kỹ năng mềm & Phát triển bản thân', code: 'KNMB', description: 'Tâm lý học ứng dụng, giao tiếp, tư duy tích cực', bookCount: 40 },
  { id: 'cat-5', name: 'Ngoại ngữ & Luyện thi', code: 'NNLT', description: 'Tiếng Anh IELTS/TOEIC, Tiếng Nhật, Tiếng Hàn', bookCount: 25 },
  { id: 'cat-6', name: 'Khoa học Tự nhiên & Khám phá vũ trụ', code: 'KHTN', description: 'Vật lý thiên văn, sinh học, vũ trụ và khoa học đại cương', bookCount: 20 },
];

export const mockAuthors: Author[] = [
  { id: 'auth-1', name: 'Robert C. Martin (Uncle Bob)', nationality: 'Mỹ', birthYear: 1952, biography: 'Chuyên gia công nghệ phần mềm, tác giả nguyên lý Clean Code và SOLID' },
  { id: 'auth-2', name: 'Nguyễn Nhật Ánh', nationality: 'Việt Nam', birthYear: 1955, biography: 'Nhà văn thiếu nhi và thanh thiếu niên hàng đầu Việt Nam' },
  { id: 'auth-3', name: 'Yuval Noah Harari', nationality: 'Israel', birthYear: 1976, biography: 'Nhà sử học, tác giả bộ ba Sapiens, Homo Deus, 21 Bài học cho thế kỷ 21' },
  { id: 'auth-4', name: 'Dale Carnegie', nationality: 'Mỹ', birthYear: 1888, biography: 'Bậc thầy về nghệ thuật đối nhân xử thế và thuyết trình' },
  { id: 'auth-5', name: 'Martin Fowler', nationality: 'Anh', birthYear: 1963, biography: 'Tác giả nổi tiếng về kiến trúc phần mềm, Refactoring và Microservices' },
  { id: 'auth-6', name: 'Erich Gamma & Gang of Four', nationality: 'Mỹ', birthYear: 1961, biography: 'Các tác giả của bộ sách Design Patterns định hình lập trình hướng đối tượng' },
  { id: 'auth-7', name: 'Paulo Coelho', nationality: 'Brazil', birthYear: 1947, biography: 'Tiểu thuyết gia người Brazil, tác giả cuốn sách Nhà Giả Kim bán chạy toàn cầu' },
  { id: 'auth-8', name: 'Robert T. Kiyosaki', nationality: 'Mỹ', birthYear: 1947, biography: 'Nhà đầu tư, tác giả bộ sách Cha Giàu Cha Nghèo truyền cảm hứng tài chính' },
  { id: 'auth-9', name: 'Daniel Kahneman', nationality: 'Israel', birthYear: 1934, biography: 'Nhà tâm lý học đoạt giải Nobel Kinh tế, tác giả Tư Duy Nhanh Và Chậm' },
  { id: 'auth-10', name: 'Rosie Nguyễn', nationality: 'Việt Nam', birthYear: 1987, biography: 'Tác giả trẻ truyền cảm hứng sống tích cực, Tuổi Trẻ Đáng Giá Bao Nhiêu' },
  { id: 'auth-11', name: 'Eric Ries', nationality: 'Mỹ', birthYear: 1978, biography: 'Doanh nhân Thung lũng Silicon, người khởi xướng phong trào Lean Startup' },
  { id: 'auth-12', name: 'Tô Hoài', nationality: 'Việt Nam', birthYear: 1920, biography: 'Đại thụ văn học Việt Nam, tác giả kiệt tác Dế Mèn Phiêu Lưu Ký' },
  { id: 'auth-13', name: 'Stephen Hawking', nationality: 'Anh', birthYear: 1942, biography: 'Nhà vật lý lý thuyết lỗi lạc, khám phá nguồn gốc và cấu trúc vũ trụ' },
  { id: 'auth-14', name: 'Raymond Murphy', nationality: 'Anh', birthYear: 1946, biography: 'Tác giả bộ sách ngữ pháp tiếng Anh kinh điển English Grammar in Use' }
];

export const mockShelves: Shelf[] = [
  { id: 'shelf-1', code: 'KE-A1', name: 'Kệ A1 - CNTT & Phần Mềm', location: 'Tầng 1 - Phòng A101', capacity: 150, currentUsage: 85, description: 'Sách chuyên ngành lập trình' },
  { id: 'shelf-2', code: 'KE-A2', name: 'Kệ A2 - Kinh Tế & Khởi Nghiệp', location: 'Tầng 1 - Phòng A102', capacity: 150, currentUsage: 80, description: 'Sách quản trị kinh doanh' },
  { id: 'shelf-3', code: 'KE-B1', name: 'Kệ B1 - Văn Học Việt Nam', location: 'Tầng 2 - Phòng B201', capacity: 150, currentUsage: 85, description: 'Văn học cổ điển và hiện đại' },
  { id: 'shelf-4', code: 'KE-B2', name: 'Kệ B2 - Kỹ Năng Sống', location: 'Tầng 2 - Phòng B202', capacity: 150, currentUsage: 80, description: 'Tâm lý, kỹ năng tư duy' },
  { id: 'shelf-5', code: 'KE-C1', name: 'Kệ C1 - Văn Học Thế Giới', location: 'Tầng 2 - Phòng B203', capacity: 150, currentUsage: 75, description: 'Tiểu thuyết kinh điển quốc tế' },
  { id: 'shelf-6', code: 'KE-D1', name: 'Kệ D1 - Ngoại Ngữ & Luyện Thi', location: 'Tầng 3 - Phòng C301', capacity: 150, currentUsage: 70, description: 'IELTS, TOEIC, Ngữ pháp' },
  { id: 'shelf-7', code: 'KE-E1', name: 'Kệ E1 - Khoa Học & Vũ Trụ', location: 'Tầng 3 - Phòng C302', capacity: 150, currentUsage: 65, description: 'Khoa học tự nhiên và khám phá' },
];

interface RawBookMeta {
  id: string;
  title: string;
  isbn: string;
  authorId: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  publisher: string;
  publicationYear: number;
  description: string;
  coverImage: string;
  shelfId: string;
  shelfCode: string;
  shelfLocation: string;
  totalCopies: number;
  borrowedCount: number;
  holdingCount: number;
  barcodePrefix: string;
}

const rawBooksMeta: RawBookMeta[] = [
  {
    id: 'b-1',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    isbn: '978-0132350884',
    authorId: 'auth-1',
    authorName: 'Robert C. Martin (Uncle Bob)',
    categoryId: 'cat-1',
    categoryName: 'Công nghệ thông tin & Lập trình',
    publisher: 'Prentice Hall',
    publicationYear: 2008,
    description: 'Cuốn cẩm nang kinh điển dành cho bất kỳ kỹ sư phần mềm nào muốn nâng cao chất lượng code, hiểu rõ nguyên lý Clean Code và áp dụng thực tiễn.',
    coverImage: '/covers/b-1.svg',
    shelfId: 'shelf-1',
    shelfCode: 'KE-A1',
    shelfLocation: 'Tầng 1 - Phòng A101',
    totalCopies: 30,
    borrowedCount: 2,
    holdingCount: 0,
    barcodePrefix: 'CC'
  },
  {
    id: 'b-2',
    title: 'Mắt Biếc',
    isbn: '978-604-2-08578-1',
    authorId: 'auth-2',
    authorName: 'Nguyễn Nhật Ánh',
    categoryId: 'cat-2',
    categoryName: 'Văn học & Nghệ thuật',
    publisher: 'NXB Trẻ',
    publicationYear: 2019,
    description: 'Tác phẩm văn học lãng mạn gắn liền với tuổi thanh xuân qua chuyện tình đơn phương đầy day dứt của Ngạn dành cho Hà Lan tại làng Đo Đo.',
    coverImage: '/covers/b-2.svg',
    shelfId: 'shelf-3',
    shelfCode: 'KE-B1',
    shelfLocation: 'Tầng 2 - Phòng B201',
    totalCopies: 26,
    borrowedCount: 1,
    holdingCount: 1,
    barcodePrefix: 'MB'
  },
  {
    id: 'b-3',
    title: 'Sapiens: Lược Sử Loài Người',
    isbn: '978-0062316097',
    authorId: 'auth-3',
    authorName: 'Yuval Noah Harari',
    categoryId: 'cat-4',
    categoryName: 'Kỹ năng mềm & Phát triển bản thân',
    publisher: 'Harper',
    publicationYear: 2015,
    description: 'Hành trình 70.000 năm phát triển của Homo Sapiens từ động vật không có gì nổi bật đến vị thế thống trị hành tinh trái đất.',
    coverImage: '/covers/b-3.svg',
    shelfId: 'shelf-4',
    shelfCode: 'KE-B2',
    shelfLocation: 'Tầng 2 - Phòng B202',
    totalCopies: 28,
    borrowedCount: 2,
    holdingCount: 0,
    barcodePrefix: 'SP'
  },
  {
    id: 'b-4',
    title: 'Đắc Nhân Tâm (How to Win Friends and Influence People)',
    isbn: '978-0671027032',
    authorId: 'auth-4',
    authorName: 'Dale Carnegie',
    categoryId: 'cat-4',
    categoryName: 'Kỹ năng mềm & Phát triển bản thân',
    publisher: 'Simon & Schuster',
    publicationYear: 2020,
    description: 'Nghệ thuật giao tiếp, thấu hiểu tâm lý con người và tạo dựng các mối quan hệ bền vững thành công nhất mọi thời đại.',
    coverImage: '/covers/b-4.svg',
    shelfId: 'shelf-4',
    shelfCode: 'KE-B2',
    shelfLocation: 'Tầng 2 - Phòng B202',
    totalCopies: 30,
    borrowedCount: 2,
    holdingCount: 0,
    barcodePrefix: 'DNT'
  },
  {
    id: 'b-5',
    title: 'Refactoring: Improving the Design of Existing Code',
    isbn: '978-0134757599',
    authorId: 'auth-5',
    authorName: 'Martin Fowler',
    categoryId: 'cat-1',
    categoryName: 'Công nghệ thông tin & Lập trình',
    publisher: 'Addison-Wesley',
    publicationYear: 2018,
    description: 'Các kỹ thuật tái cấu trúc mã nguồn để cải thiện tính dễ đọc, bảo trì và mở rộng hệ thống phần mềm mà không thay đổi hành vi bên ngoài.',
    coverImage: '/covers/b-5.svg',
    shelfId: 'shelf-1',
    shelfCode: 'KE-A1',
    shelfLocation: 'Tầng 1 - Phòng A101',
    totalCopies: 25,
    borrowedCount: 1,
    holdingCount: 0,
    barcodePrefix: 'RF'
  },
  {
    id: 'b-6',
    title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
    isbn: '978-604-2-12345-0',
    authorId: 'auth-2',
    authorName: 'Nguyễn Nhật Ánh',
    categoryId: 'cat-2',
    categoryName: 'Văn học & Nghệ thuật',
    publisher: 'NXB Trẻ',
    publicationYear: 2021,
    description: 'Bức tranh làng quê yên ả trong ký ức tuổi thơ nghèo khó của những đứa trẻ, tràn ngập tình anh em, tình làng nghĩa xóm.',
    coverImage: '/covers/b-6.svg',
    shelfId: 'shelf-3',
    shelfCode: 'KE-B1',
    shelfLocation: 'Tầng 2 - Phòng B201',
    totalCopies: 25,
    borrowedCount: 0,
    holdingCount: 0,
    barcodePrefix: 'HVTCX'
  },
  // 10 NEW BOOKS ADDED:
  {
    id: 'b-7',
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    isbn: '978-0201633610',
    authorId: 'auth-6',
    authorName: 'Erich Gamma & Gang of Four',
    categoryId: 'cat-1',
    categoryName: 'Công nghệ thông tin & Lập trình',
    publisher: 'Addison-Wesley',
    publicationYear: 2020,
    description: 'Kinh điển về 23 mẫu thiết kế phần mềm hướng đối tượng chuẩn mực giúp tạo ra các hệ thống linh hoạt, dễ tái sử dụng và bảo trì.',
    coverImage: '/covers/b-7.svg',
    shelfId: 'shelf-1',
    shelfCode: 'KE-A1',
    shelfLocation: 'Tầng 1 - Phòng A101',
    totalCopies: 26,
    borrowedCount: 1,
    holdingCount: 0,
    barcodePrefix: 'DP'
  },
  {
    id: 'b-8',
    title: 'Nhà Giả Kim (The Alchemist)',
    isbn: '978-604-58-9123-4',
    authorId: 'auth-7',
    authorName: 'Paulo Coelho',
    categoryId: 'cat-2',
    categoryName: 'Văn học & Nghệ thuật',
    publisher: 'NXB Hội Nhà Văn',
    publicationYear: 2021,
    description: 'Cuốn tiểu thuyết triết lý sâu sắc về hành trình theo đuổi vận mệnh cuộc đời của chàng trai chăn cừu Santiago qua sa mạc Kim Tự Tháp.',
    coverImage: '/covers/b-8.svg',
    shelfId: 'shelf-5',
    shelfCode: 'KE-C1',
    shelfLocation: 'Tầng 2 - Phòng B203',
    totalCopies: 30,
    borrowedCount: 1,
    holdingCount: 0,
    barcodePrefix: 'NGK'
  },
  {
    id: 'b-9',
    title: 'Cha Giàu Cha Nghèo (Rich Dad Poor Dad)',
    isbn: '978-604-89-2234-5',
    authorId: 'auth-8',
    authorName: 'Robert T. Kiyosaki',
    categoryId: 'cat-3',
    categoryName: 'Kinh tế & Quản trị kinh doanh',
    publisher: 'NXB Trẻ',
    publicationYear: 2022,
    description: 'Tác phẩm giáo dục tài chính đột phá, thay đổi tư duy tiền bạc, phân biệt rõ ràng giữa tài sản và tiêu sản để đạt tự do tài chính.',
    coverImage: '/covers/b-9.svg',
    shelfId: 'shelf-2',
    shelfCode: 'KE-A2',
    shelfLocation: 'Tầng 1 - Phòng A102',
    totalCopies: 28,
    borrowedCount: 1,
    holdingCount: 0,
    barcodePrefix: 'CGCN'
  },
  {
    id: 'b-10',
    title: 'Tư Duy Nhanh Và Chậm (Thinking, Fast and Slow)',
    isbn: '978-0374533557',
    authorId: 'auth-9',
    authorName: 'Daniel Kahneman',
    categoryId: 'cat-4',
    categoryName: 'Kỹ năng mềm & Phát triển bản thân',
    publisher: 'NXB Thế Giới',
    publicationYear: 2021,
    description: 'Cuốn sách khám phá hai hệ thống tư duy chi phối cách con người nhận định và đưa ra quyết định: bản năng nhanh chóng và lý trí cẩn trọng.',
    coverImage: '/covers/b-10.svg',
    shelfId: 'shelf-4',
    shelfCode: 'KE-B2',
    shelfLocation: 'Tầng 2 - Phòng B202',
    totalCopies: 25,
    borrowedCount: 1,
    holdingCount: 0,
    barcodePrefix: 'TDNC'
  },
  {
    id: 'b-11',
    title: 'Lập Trình Web Hiện Đại với React & TypeScript',
    isbn: '978-1491954621',
    authorId: 'auth-5',
    authorName: 'Martin Fowler & Cộng sự',
    categoryId: 'cat-1',
    categoryName: 'Công nghệ thông tin & Lập trình',
    publisher: 'O’Reilly Media',
    publicationYear: 2023,
    description: 'Chỉ dẫn thực hành toàn diện về phát triển giao diện hiện đại với React 18, kiến trúc Single Page Application, TypeScript và State Management.',
    coverImage: '/covers/b-11.svg',
    shelfId: 'shelf-1',
    shelfCode: 'KE-A1',
    shelfLocation: 'Tầng 1 - Phòng A101',
    totalCopies: 30,
    borrowedCount: 2,
    holdingCount: 0,
    barcodePrefix: 'RTS'
  },
  {
    id: 'b-12',
    title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu?',
    isbn: '978-604-2-09876-5',
    authorId: 'auth-10',
    authorName: 'Rosie Nguyễn',
    categoryId: 'cat-4',
    categoryName: 'Kỹ năng mềm & Phát triển bản thân',
    publisher: 'NXB Nhã Nam',
    publicationYear: 2022,
    description: 'Tác phẩm truyền cảm hứng rực rỡ dành cho sinh viên và người trẻ về đam mê, tự học, rèn luyện kỹ năng và tìm kiếm ý nghĩa sống.',
    coverImage: '/covers/b-12.svg',
    shelfId: 'shelf-4',
    shelfCode: 'KE-B2',
    shelfLocation: 'Tầng 2 - Phòng B202',
    totalCopies: 26,
    borrowedCount: 1,
    holdingCount: 0,
    barcodePrefix: 'TTDG'
  },
  {
    id: 'b-13',
    title: 'Khởi Nghiệp Tinh Gọn (The Lean Startup)',
    isbn: '978-0307887894',
    authorId: 'auth-11',
    authorName: 'Eric Ries',
    categoryId: 'cat-3',
    categoryName: 'Kinh tế & Quản trị kinh doanh',
    publisher: 'NXB Tổng Hợp TP.HCM',
    publicationYear: 2020,
    description: 'Mô hình xây dựng sản phẩm và thử nghiệm giả thuyết kinh doanh nhanh chóng, giảm thiểu tối đa lãng phí và nguy cơ thất bại.',
    coverImage: '/covers/b-13.svg',
    shelfId: 'shelf-2',
    shelfCode: 'KE-A2',
    shelfLocation: 'Tầng 1 - Phòng A102',
    totalCopies: 25,
    borrowedCount: 1,
    holdingCount: 0,
    barcodePrefix: 'KNTG'
  },
  {
    id: 'b-14',
    title: 'Dế Mèn Phiêu Lưu Ký',
    isbn: '978-604-2-15678-9',
    authorId: 'auth-12',
    authorName: 'Tô Hoài',
    categoryId: 'cat-2',
    categoryName: 'Văn học & Nghệ thuật',
    publisher: 'NXB Kim Đồng',
    publicationYear: 2022,
    description: 'Kiệt tác văn học thiếu nhi kinh điển của Việt Nam kể về hành trình đầy dũng cảm, tình bạn và bài học đối nhân xử thế của Dế Mèn.',
    coverImage: '/covers/b-14.svg',
    shelfId: 'shelf-3',
    shelfCode: 'KE-B1',
    shelfLocation: 'Tầng 2 - Phòng B201',
    totalCopies: 30,
    borrowedCount: 0,
    holdingCount: 0,
    barcodePrefix: 'DMPLK'
  },
  {
    id: 'b-15',
    title: 'Vũ Trụ Trong Vỏ Hạt Dẻ (The Universe in a Nutshell)',
    isbn: '978-0553802023',
    authorId: 'auth-13',
    authorName: 'Stephen Hawking',
    categoryId: 'cat-6',
    categoryName: 'Khoa học Tự nhiên & Khám phá vũ trụ',
    publisher: 'NXB Trẻ',
    publicationYear: 2021,
    description: 'Khám phá thuyết tương đối, lỗ đen, màng vũ trụ, chiều không gian ẩn và những định luật hấp dẫn nhất của vũ trụ học đương đại.',
    coverImage: '/covers/b-15.svg',
    shelfId: 'shelf-7',
    shelfCode: 'KE-E1',
    shelfLocation: 'Tầng 3 - Phòng C302',
    totalCopies: 25,
    borrowedCount: 1,
    holdingCount: 0,
    barcodePrefix: 'VTVHD'
  },
  {
    id: 'b-16',
    title: 'English Grammar in Use (5th Edition)',
    isbn: '978-1108457651',
    authorId: 'auth-14',
    authorName: 'Raymond Murphy',
    categoryId: 'cat-5',
    categoryName: 'Ngoại ngữ & Luyện thi',
    publisher: 'Cambridge University Press',
    publicationYear: 2022,
    description: 'Giáo trình ngữ pháp tiếng Anh chuẩn quốc tế Cambridge được tin cậy nhất thế giới dành cho người tự học từ trung cấp đến nâng cao.',
    coverImage: '/covers/b-16.svg',
    shelfId: 'shelf-6',
    shelfCode: 'KE-D1',
    shelfLocation: 'Tầng 3 - Phòng C301',
    totalCopies: 30,
    borrowedCount: 1,
    holdingCount: 0,
    barcodePrefix: 'EGIU'
  }
];

// Generate copies dynamically
const generatedCopies: BookCopy[] = [];
const generatedBooks: Book[] = [];

for (const meta of rawBooksMeta) {
  const bookCopies: BookCopy[] = [];
  const availableCopiesCount = meta.totalCopies - meta.borrowedCount - meta.holdingCount;

  for (let i = 1; i <= meta.totalCopies; i++) {
    const copyId = `cp-${meta.id}-${String(i).padStart(3, '0')}`;
    const barcode = `BC-${meta.barcodePrefix}-${String(i).padStart(3, '0')}`;
    let status: 'AVAILABLE' | 'BORROWED' | 'HOLDING' = 'AVAILABLE';

    if (i <= meta.borrowedCount) {
      status = 'BORROWED';
    } else if (i <= meta.borrowedCount + meta.holdingCount) {
      status = 'HOLDING';
    }

    const copyObj: BookCopy = {
      id: copyId,
      bookId: meta.id,
      bookTitle: meta.title,
      barcode,
      shelfId: meta.shelfId,
      shelfCode: meta.shelfCode,
      shelfLocation: meta.shelfLocation,
      status,
      condition: i % 5 === 0 ? 'Mới 90%' : i % 3 === 0 ? 'Mới 95%' : 'Mới 100%'
    };

    bookCopies.push(copyObj);
    generatedCopies.push(copyObj);
  }

  generatedBooks.push({
    id: meta.id,
    title: meta.title,
    isbn: meta.isbn,
    authorId: meta.authorId,
    authorName: meta.authorName,
    categoryId: meta.categoryId,
    categoryName: meta.categoryName,
    publisher: meta.publisher,
    publicationYear: meta.publicationYear,
    description: meta.description,
    coverImage: meta.coverImage,
    totalCopies: meta.totalCopies,
    availableCopies: availableCopiesCount,
    copies: bookCopies
  });
}

export const mockCopies: BookCopy[] = generatedCopies;
export const mockBooks: Book[] = generatedBooks;

export const mockTickets: BorrowTicket[] = [
  {
    id: 'ticket-1',
    ticketCode: 'TK-202410-001',
    readerCardId: 'card-001',
    readerCardNumber: 'DG-2024-001',
    userId: 'user-borrower',
    userName: 'borrower',
    userFullName: 'Lê Hoàng Độc Giả',
    borrowDate: '2024-10-01',
    dueDate: '2026-10-30',
    status: 'BORROWED',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%232563eb"/><text x="50" y="55" fill="white" font-size="12" text-anchor="middle">TK-001</text></svg>',
    items: [
      {
        id: 'td-1',
        ticketId: 'ticket-1',
        copyId: 'cp-b-1-001',
        bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        barcode: 'BC-CC-001',
        shelfCode: 'KE-A1',
        status: 'BORROWED',
      }
    ]
  },
  {
    id: 'ticket-2',
    ticketCode: 'TK-202410-002',
    readerCardId: 'card-001',
    readerCardNumber: 'DG-2024-001',
    userId: 'user-borrower',
    userName: 'borrower',
    userFullName: 'Lê Hoàng Độc Giả',
    borrowDate: '2024-10-14',
    dueDate: '2026-10-28',
    status: 'PENDING',
    holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f59e0b"/><text x="50" y="55" fill="white" font-size="12" text-anchor="middle">TK-002</text></svg>',
    items: [
      {
        id: 'td-2',
        ticketId: 'ticket-2',
        copyId: 'cp-b-2-002',
        bookTitle: 'Mắt Biếc',
        barcode: 'BC-MB-002',
        shelfCode: 'KE-B1',
        status: 'HOLDING',
      }
    ]
  },
  {
    id: 'ticket-3',
    ticketCode: 'TK-202410-003',
    readerCardId: 'card-002',
    readerCardNumber: 'DG-2024-002',
    userId: 'user-borrower-2',
    userName: 'sv2024',
    userFullName: 'Phạm Thuỳ Trang',
    borrowDate: '2024-09-15',
    dueDate: '2024-09-29',
    returnDate: '2024-09-28',
    status: 'RETURNED',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2310b981"/><text x="50" y="55" fill="white" font-size="12" text-anchor="middle">TK-003</text></svg>',
    items: [
      {
        id: 'td-3',
        ticketId: 'ticket-3',
        copyId: 'cp-b-4-001',
        bookTitle: 'Đắc Nhân Tâm (How to Win Friends and Influence People)',
        barcode: 'BC-DNT-001',
        shelfCode: 'KE-B2',
        status: 'RETURNED',
        returnedAt: '2024-09-28'
      }
    ]
  },
  {
    id: 'ticket-4',
    ticketCode: 'TK-202409-045',
    readerCardId: 'card-001',
    readerCardNumber: 'DG-2024-001',
    userId: 'user-borrower',
    userName: 'borrower',
    userFullName: 'Lê Hoàng Độc Giả',
    borrowDate: '2024-09-01',
    dueDate: '2024-09-15',
    status: 'OVERDUE',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ef4444"/><text x="50" y="55" fill="white" font-size="12" text-anchor="middle">TK-045</text></svg>',
    items: [
      {
        id: 'td-4',
        ticketId: 'ticket-4',
        copyId: 'cp-b-3-001',
        bookTitle: 'Sapiens: Lược Sử Loài Người',
        barcode: 'BC-SP-001',
        shelfCode: 'KE-B2',
        status: 'OVERDUE',
      }
    ]
  }
];

export const mockFines: Fine[] = [
  {
    id: 'fine-1',
    ticketId: 'ticket-4',
    ticketCode: 'TK-202409-045',
    userId: 'user-borrower',
    userFullName: 'Lê Hoàng Độc Giả',
    amount: 35000,
    reason: 'Trễ hạn trả sách 7 ngày (5.000đ/ngày)',
    status: 'UNPAID',
    dueDate: '2026-10-20',
  },
  {
    id: 'fine-2',
    ticketId: 'ticket-old',
    ticketCode: 'TK-202408-012',
    userId: 'user-borrower-2',
    userFullName: 'Phạm Thuỳ Trang',
    amount: 15000,
    reason: 'Trễ hạn trả sách 3 ngày',
    status: 'PAID',
    dueDate: '2024-08-30',
    paidAt: '2024-08-29T10:15:00Z',
    paymentMethod: 'CASH'
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    actorId: 'user-lib',
    actorName: 'Nguyễn Thị Thủ Thư',
    actorRole: 'LIBRARIAN',
    action: 'DUYỆT_PHIẾU_MƯỢN',
    entityType: 'BorrowTicket',
    entityId: 'TK-202410-001',
    details: 'Đã duyệt xuất sách Clean Code cho độc giả Lê Hoàng Độc Giả',
    ipAddress: '192.168.1.105',
    timestamp: '2026-10-01T09:12:45Z',
  },
  {
    id: 'log-2',
    actorId: 'user-borrower',
    actorName: 'Lê Hoàng Độc Giả',
    actorRole: 'BORROWER',
    action: 'GIỮ_SÁCH_ONLINE',
    entityType: 'BorrowTicket',
    entityId: 'TK-202410-002',
    details: 'Đăng ký giữ sách Mắt Biếc tại Kệ B1 (thời hạn 5 phút)',
    ipAddress: '14.232.208.55',
    timestamp: '2026-10-14T15:20:00Z',
  },
  {
    id: 'log-3',
    actorId: 'user-admin',
    actorName: 'Trần Văn Quản Trị',
    actorRole: 'ADMIN',
    action: 'CẬP_NHẬT_KỆ_SÁCH',
    entityType: 'Shelf',
    entityId: 'KE-A1',
    details: 'Mở rộng sức chứa Kệ A1 lên 150 cuốn',
    ipAddress: '192.168.1.101',
    timestamp: '2026-10-12T11:04:18Z',
  },
  {
    id: 'log-4',
    actorId: 'user-lib',
    actorName: 'Nguyễn Thị Thủ Thư',
    actorRole: 'LIBRARIAN',
    action: 'NHẬN_TRẢ_SÁCH',
    entityType: 'BorrowTicket',
    entityId: 'TK-202409-089',
    details: 'Xác nhận thu hồi sách Mắt Biếc (BC-MB-001) về Kệ B1',
    ipAddress: '192.168.1.105',
    timestamp: '2026-09-22T16:30:10Z',
  }
];

export const mockStatistics: Statistics = {
  totalBorrows: 185,
  totalReturns: 152,
  totalOverdue: 6,
  fineRevenue: 540000,
  borrowsByCategory: [
    { category: 'Công nghệ thông tin', count: 68 },
    { category: 'Văn học & Nghệ thuật', count: 54 },
    { category: 'Kỹ năng sống', count: 42 },
    { category: 'Kinh tế & Quản trị', count: 32 },
    { category: 'Ngoại ngữ', count: 18 },
    { category: 'Khoa học tự nhiên', count: 15 }
  ],
  monthlyBorrows: [
    { month: 'T5', borrows: 80, returns: 75 },
    { month: 'T6', borrows: 95, returns: 88 },
    { month: 'T7', borrows: 110, returns: 102 },
    { month: 'T8', borrows: 130, returns: 115 },
    { month: 'T9', borrows: 155, returns: 135 },
    { month: 'T10', borrows: 185, returns: 152 },
  ],
  recentActivities: mockAuditLogs,
  overdueTickets: [mockTickets[3]]
};
