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
    expiryDate: '2025-03-10',
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
    expiryDate: '2025-04-12',
    status: 'ACTIVE',
    maxBorrowLimit: 5,
    currentBorrowCount: 1,
  }
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Công nghệ thông tin & Lập trình', code: 'CNTT', description: 'Sách chuyên ngành phần mềm, AI, mạng máy tính', bookCount: 15 },
  { id: 'cat-2', name: 'Văn học & Nghệ thuật', code: 'VHNT', description: 'Tiểu thuyết, truyện ngắn, thơ ca Việt Nam và thế giới', bookCount: 28 },
  { id: 'cat-3', name: 'Kinh tế & Quản trị kinh doanh', code: 'KTQT', description: 'Tài chính, marketing, quản lý và khởi nghiệp', bookCount: 19 },
  { id: 'cat-4', name: 'Kỹ năng mềm & Phát triển bản thân', code: 'KNMB', description: 'Tâm lý học ứng dụng, giao tiếp, tư duy tích cực', bookCount: 22 },
  { id: 'cat-5', name: 'Ngoại ngữ & Luyện thi', code: 'NNLT', description: 'Tiếng Anh IELTS/TOEIC, Tiếng Nhật, Tiếng Hàn', bookCount: 12 },
];

export const mockAuthors: Author[] = [
  { id: 'auth-1', name: 'Robert C. Martin (Uncle Bob)', nationality: 'Mỹ', birthYear: 1952, biography: 'Chuyên gia công nghệ phần mềm, tác giả nguyên lý Clean Code và SOLID' },
  { id: 'auth-2', name: 'Nguyễn Nhật Ánh', nationality: 'Việt Nam', birthYear: 1955, biography: 'Nhà văn thiếu nhi và thanh thiếu niên hàng đầu Việt Nam' },
  { id: 'auth-3', name: 'Yuval Noah Harari', nationality: 'Israel', birthYear: 1976, biography: 'Nhà sử học, tác giả bộ ba Sapiens, Homo Deus, 21 Bài học cho thế kỷ 21' },
  { id: 'auth-4', name: 'Dale Carnegie', nationality: 'Mỹ', birthYear: 1888, biography: 'Bậc thầy về nghệ thuật đối nhân xử thế và thuyết trình' },
  { id: 'auth-5', name: 'Martin Fowler', nationality: 'Anh', birthYear: 1963, biography: 'Tác giả nổi tiếng về kiến trúc phần mềm, Refactoring và Microservices' }
];

export const mockShelves: Shelf[] = [
  { id: 'shelf-1', code: 'KE-A1', name: 'Kệ A1 - CNTT & Phần Mềm', location: 'Tầng 1 - Phòng A101', capacity: 100, currentUsage: 45, description: 'Sách chuyên ngành lập trình' },
  { id: 'shelf-2', code: 'KE-A2', name: 'Kệ A2 - Kinh Tế & Khởi Nghiệp', location: 'Tầng 1 - Phòng A102', capacity: 120, currentUsage: 78, description: 'Sách quản trị kinh doanh' },
  { id: 'shelf-3', code: 'KE-B1', name: 'Kệ B1 - Văn Học Việt Nam', location: 'Tầng 2 - Phòng B201', capacity: 150, currentUsage: 110, description: 'Văn học cổ điển và hiện đại' },
  { id: 'shelf-4', code: 'KE-B2', name: 'Kệ B2 - Kỹ Năng Sống', location: 'Tầng 2 - Phòng B202', capacity: 80, currentUsage: 55, description: 'Tâm lý, kỹ năng tư duy' },
];

export const mockCopies: BookCopy[] = [
  { id: 'cp-001', bookId: 'b-1', bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship', barcode: 'BC-CC-001', shelfId: 'shelf-1', shelfCode: 'KE-A1', shelfLocation: 'Tầng 1 - Phòng A101', status: 'AVAILABLE', condition: 'Mới 95%' },
  { id: 'cp-002', bookId: 'b-1', bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship', barcode: 'BC-CC-002', shelfId: 'shelf-1', shelfCode: 'KE-A1', shelfLocation: 'Tầng 1 - Phòng A101', status: 'BORROWED', condition: 'Mới 90%' },
  { id: 'cp-003', bookId: 'b-1', bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship', barcode: 'BC-CC-003', shelfId: 'shelf-1', shelfCode: 'KE-A1', shelfLocation: 'Tầng 1 - Phòng A101', status: 'AVAILABLE', condition: 'Mới 100%' },

  { id: 'cp-004', bookId: 'b-2', bookTitle: 'Mắt Biếc', barcode: 'BC-MB-001', shelfId: 'shelf-3', shelfCode: 'KE-B1', shelfLocation: 'Tầng 2 - Phòng B201', status: 'AVAILABLE', condition: 'Tốt' },
  { id: 'cp-005', bookId: 'b-2', bookTitle: 'Mắt Biếc', barcode: 'BC-MB-002', shelfId: 'shelf-3', shelfCode: 'KE-B1', shelfLocation: 'Tầng 2 - Phòng B201', status: 'HOLDING', condition: 'Tốt' },

  { id: 'cp-006', bookId: 'b-3', bookTitle: 'Sapiens: Lược Sử Loài Người', barcode: 'BC-SP-001', shelfId: 'shelf-4', shelfCode: 'KE-B2', shelfLocation: 'Tầng 2 - Phòng B202', status: 'BORROWED', condition: 'Mới 98%' },
  { id: 'cp-007', bookId: 'b-3', bookTitle: 'Sapiens: Lược Sử Loài Người', barcode: 'BC-SP-002', shelfId: 'shelf-4', shelfCode: 'KE-B2', shelfLocation: 'Tầng 2 - Phòng B202', status: 'AVAILABLE', condition: 'Mới 95%' },

  { id: 'cp-008', bookId: 'b-4', bookTitle: 'Đắc Nhân Tâm (How to Win Friends and Influence People)', barcode: 'BC-DNT-001', shelfId: 'shelf-4', shelfCode: 'KE-B2', shelfLocation: 'Tầng 2 - Phòng B202', status: 'AVAILABLE', condition: 'Tốt' },
  { id: 'cp-009', bookId: 'b-4', bookTitle: 'Đắc Nhân Tâm (How to Win Friends and Influence People)', barcode: 'BC-DNT-002', shelfId: 'shelf-4', shelfCode: 'KE-B2', shelfLocation: 'Tầng 2 - Phòng B202', status: 'AVAILABLE', condition: 'Tốt' },

  { id: 'cp-010', bookId: 'b-5', bookTitle: 'Refactoring: Improving the Design of Existing Code', barcode: 'BC-RF-001', shelfId: 'shelf-1', shelfCode: 'KE-A1', shelfLocation: 'Tầng 1 - Phòng A101', status: 'AVAILABLE', condition: 'Mới 99%' },
  { id: 'cp-011', bookId: 'b-6', bookTitle: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', barcode: 'BC-HVTCX-001', shelfId: 'shelf-3', shelfCode: 'KE-B1', shelfLocation: 'Tầng 2 - Phòng B201', status: 'AVAILABLE', condition: 'Tốt' },
];

export const mockBooks: Book[] = [
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
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80',
    totalCopies: 3,
    availableCopies: 2,
    copies: [mockCopies[0], mockCopies[1], mockCopies[2]],
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
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    totalCopies: 2,
    availableCopies: 1,
    copies: [mockCopies[3], mockCopies[4]],
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
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    totalCopies: 2,
    availableCopies: 1,
    copies: [mockCopies[5], mockCopies[6]],
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
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    totalCopies: 2,
    availableCopies: 2,
    copies: [mockCopies[7], mockCopies[8]],
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
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    totalCopies: 1,
    availableCopies: 1,
    copies: [mockCopies[9]],
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
    publicationYear: 2010,
    description: 'Bức tranh làng quê yên ả trong ký ức tuổi thơ nghèo khó của những đứa trẻ, tràn ngập tình anh em, tình làng nghĩa xóm.',
    coverImage: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80',
    totalCopies: 1,
    availableCopies: 1,
    copies: [mockCopies[10]],
  }
];

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
    dueDate: '2024-10-15',
    status: 'BORROWED',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="black">TK-202410-001</text></svg>',
    items: [
      {
        id: 'td-1',
        ticketId: 'ticket-1',
        copyId: 'cp-002',
        bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        barcode: 'BC-CC-002',
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
    dueDate: '2024-10-28',
    status: 'PENDING',
    holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="black">TK-202410-002</text></svg>',
    items: [
      {
        id: 'td-2',
        ticketId: 'ticket-2',
        copyId: 'cp-005',
        bookTitle: 'Mắt Biếc',
        barcode: 'BC-MB-002',
        shelfCode: 'KE-B1',
        status: 'HOLDING',
      }
    ]
  },
  {
    id: 'ticket-3',
    ticketCode: 'TK-202409-089',
    readerCardId: 'card-002',
    readerCardNumber: 'DG-2024-002',
    userId: 'user-borrower-2',
    userName: 'sv2024',
    userFullName: 'Phạm Thuỳ Trang',
    borrowDate: '2024-09-10',
    dueDate: '2024-09-24',
    returnDate: '2024-09-22',
    status: 'RETURNED',
    items: [
      {
        id: 'td-3',
        ticketId: 'ticket-3',
        copyId: 'cp-004',
        bookTitle: 'Mắt Biếc',
        barcode: 'BC-MB-001',
        shelfCode: 'KE-B1',
        status: 'RETURNED',
        returnedAt: '2024-09-22',
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
    borrowDate: '2024-09-15',
    dueDate: '2024-09-29',
    status: 'OVERDUE',
    totalFines: 35000,
    items: [
      {
        id: 'td-4',
        ticketId: 'ticket-4',
        copyId: 'cp-006',
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
    dueDate: '2024-10-20',
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
    timestamp: '2024-10-01T09:12:45Z',
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
    timestamp: '2024-10-14T15:20:00Z',
  },
  {
    id: 'log-3',
    actorId: 'user-admin',
    actorName: 'Trần Văn Quản Trị',
    actorRole: 'ADMIN',
    action: 'CẬP_NHẬT_KỆ_SÁCH',
    entityType: 'Shelf',
    entityId: 'KE-A1',
    details: 'Mở rộng sức chứa Kệ A1 lên 100 cuốn',
    ipAddress: '192.168.1.101',
    timestamp: '2024-10-12T11:04:18Z',
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
    timestamp: '2024-09-22T16:30:10Z',
  }
];

export const mockStatistics: Statistics = {
  totalBorrows: 142,
  totalReturns: 118,
  totalOverdue: 8,
  fineRevenue: 540000,
  borrowsByCategory: [
    { category: 'Công nghệ thông tin', count: 52 },
    { category: 'Văn học & Nghệ thuật', count: 41 },
    { category: 'Kỹ năng sống', count: 28 },
    { category: 'Kinh tế & Quản trị', count: 16 },
    { category: 'Ngoại ngữ', count: 5 }
  ],
  monthlyBorrows: [
    { month: 'T5', borrows: 80, returns: 75 },
    { month: 'T6', borrows: 95, returns: 88 },
    { month: 'T7', borrows: 110, returns: 102 },
    { month: 'T8', borrows: 130, returns: 115 },
    { month: 'T9', borrows: 155, returns: 135 },
    { month: 'T10', borrows: 142, returns: 118 },
  ],
  recentActivities: mockAuditLogs,
  overdueTickets: [mockTickets[3]]
};
