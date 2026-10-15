CREATE DATABASE IF NOT EXISTS `library_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `library_db`;

-- Table: roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(100) NULL,
  `phone` VARCHAR(20) NULL,
  `role_id` BIGINT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: reader_cards
CREATE TABLE IF NOT EXISTS `reader_cards` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `card_number` VARCHAR(30) NOT NULL UNIQUE,
  `issued_date` DATE NOT NULL,
  `expire_date` DATE NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `max_borrow` INT NOT NULL DEFAULT 5,
  CONSTRAINT `fk_reader_cards_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: authors
CREATE TABLE IF NOT EXISTS `authors` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `bio` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: books
CREATE TABLE IF NOT EXISTS `books` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `isbn` VARCHAR(20) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `author_id` BIGINT NOT NULL,
  `category_id` BIGINT NOT NULL,
  `publisher` VARCHAR(150) NULL,
  `publish_year` INT NULL,
  `total_copies` INT NOT NULL DEFAULT 0,
  `available_copies` INT NOT NULL DEFAULT 0,
  `max_borrow_days` INT NOT NULL DEFAULT 14,
  `cover_image` VARCHAR(255) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_books_author` FOREIGN KEY (`author_id`) REFERENCES `authors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_books_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: shelves
CREATE TABLE IF NOT EXISTS `shelves` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `shelf_code` VARCHAR(20) NOT NULL UNIQUE,
  `location` VARCHAR(100) NULL,
  `capacity` INT NOT NULL DEFAULT 50
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: book_copies
CREATE TABLE IF NOT EXISTS `book_copies` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `book_id` BIGINT NOT NULL,
  `shelf_id` BIGINT NULL,
  `copy_code` VARCHAR(30) NOT NULL UNIQUE,
  `status` VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  `condition_note` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_copies_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_copies_shelf` FOREIGN KEY (`shelf_id`) REFERENCES `shelves` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: borrow_tickets
CREATE TABLE IF NOT EXISTS `borrow_tickets` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `ticket_code` VARCHAR(40) NOT NULL UNIQUE,
  `reader_card_id` BIGINT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `due_date` DATETIME NOT NULL,
  `return_date` DATETIME NULL,
  `hold_expires_at` DATETIME NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `renewed` TINYINT(1) NOT NULL DEFAULT 0,
  `qr_data` TEXT NULL,
  CONSTRAINT `fk_tickets_reader` FOREIGN KEY (`reader_card_id`) REFERENCES `reader_cards` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ticket_details
CREATE TABLE IF NOT EXISTS `ticket_details` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` BIGINT NOT NULL,
  `copy_id` BIGINT NOT NULL,
  CONSTRAINT `fk_td_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `borrow_tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_td_copy` FOREIGN KEY (`copy_id`) REFERENCES `book_copies` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: fines
CREATE TABLE IF NOT EXISTS `fines` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` BIGINT NOT NULL,
  `reason` VARCHAR(50) NOT NULL DEFAULT 'OVERDUE',
  `overdue_days` INT NOT NULL DEFAULT 0,
  `fine_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_fines_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `borrow_tickets` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `fine_id` BIGINT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(30) NOT NULL,
  `paid_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_fine` FOREIGN KEY (`fine_id`) REFERENCES `fines` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `actor_id` BIGINT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` BIGINT NULL,
  `details` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: borrow_history
CREATE TABLE IF NOT EXISTS `borrow_history` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` BIGINT NOT NULL,
  `copy_id` BIGINT NOT NULL,
  `borrow_date` DATETIME NULL,
  `return_date` DATETIME NULL,
  `status` VARCHAR(20) NOT NULL,
  CONSTRAINT `fk_history_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `borrow_tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_copy` FOREIGN KEY (`copy_id`) REFERENCES `book_copies` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_books_isbn_title ON books(isbn, title);
CREATE INDEX IF NOT EXISTS idx_copies_status ON book_copies(book_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_reader ON borrow_tickets(reader_card_id, status);
-- ticket_code already has a unique key from column definition, but explicitly ensuring:
-- CREATE UNIQUE INDEX idx_tickets_qr ON borrow_tickets(ticket_code);
