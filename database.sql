-- ============================================
-- InternHub GGI - Database Schema
-- Run this file in MySQL to set up the database
-- ============================================

CREATE DATABASE IF NOT EXISTS internhub_ggi_db;
USE internhub_ggi_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'employer', 'admin') DEFAULT 'student',
  phone VARCHAR(20),
  profile_pic VARCHAR(255),
  resume VARCHAR(255),
  bio TEXT,
  skills TEXT,
  education VARCHAR(255),
  college VARCHAR(255),
  graduation_year INT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  logo VARCHAR(255),
  description TEXT,
  website VARCHAR(255),
  industry VARCHAR(100),
  size VARCHAR(50),
  location VARCHAR(150),
  founded_year INT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Internships Table
CREATE TABLE IF NOT EXISTS internships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  type ENUM('work-from-home', 'in-office', 'hybrid') DEFAULT 'in-office',
  location VARCHAR(150),
  stipend_min INT DEFAULT 0,
  stipend_max INT DEFAULT 0,
  duration VARCHAR(50),
  openings INT DEFAULT 1,
  skills_required TEXT,
  description TEXT NOT NULL,
  perks TEXT,
  apply_by DATE,
  start_date DATE,
  is_part_time BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'closed', 'draft') DEFAULT 'active',
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  type ENUM('full-time', 'part-time', 'contract', 'freelance') DEFAULT 'full-time',
  location VARCHAR(150),
  work_mode ENUM('work-from-home', 'in-office', 'hybrid') DEFAULT 'in-office',
  salary_min INT DEFAULT 0,
  salary_max INT DEFAULT 0,
  experience VARCHAR(50),
  skills_required TEXT,
  description TEXT NOT NULL,
  qualifications TEXT,
  apply_by DATE,
  openings INT DEFAULT 1,
  status ENUM('active', 'closed', 'draft') DEFAULT 'active',
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  listing_type ENUM('internship', 'job') NOT NULL,
  listing_id INT NOT NULL,
  cover_letter TEXT,
  resume VARCHAR(255),
  availability VARCHAR(100),
  status ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'hired') DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved Items (Bookmarks)
CREATE TABLE IF NOT EXISTS saved_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  listing_type ENUM('internship', 'job') NOT NULL,
  listing_id INT NOT NULL,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_save (user_id, listing_type, listing_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  internship_count INT DEFAULT 0,
  job_count INT DEFAULT 0
);

-- Insert default categories
INSERT INTO categories (name, icon) VALUES
('Web Development', '💻'),
('Digital Marketing', '📱'),
('Data Science', '📊'),
('Graphic Design', '🎨'),
('Content Writing', '✍️'),
('Finance', '💰'),
('Human Resources', '👥'),
('Sales', '📈'),
('Engineering', '⚙️'),
('Business Development', '🚀'),
('Machine Learning', '🤖'),
('UI/UX Design', '🎯');

-- Insert sample admin user (password: admin123)
INSERT INTO users (name, email, password, role, is_verified) VALUES
('Admin User', 'admin@internhubggi.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5osBcMTsGq', 'admin', TRUE);

-- Insert sample employer (password: employer123)
INSERT INTO users (name, email, password, role, is_verified) VALUES
('TechCorp HR', 'hr@techcorp.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employer', TRUE);

-- Insert sample company
INSERT INTO companies (user_id, name, description, industry, size, location, website) VALUES
(2, 'TechCorp Solutions', 'A leading tech company building innovative solutions for businesses worldwide.', 'Technology', '500-1000', 'Bangalore, India', 'https://techcorp.example.com');

-- Insert sample internships
INSERT INTO internships (company_id, title, category, type, location, stipend_min, stipend_max, duration, openings, skills_required, description, perks, apply_by, start_date) VALUES
(1, 'Frontend Developer Intern', 'Web Development', 'work-from-home', 'Remote', 10000, 20000, '3 months', 3, 'HTML, CSS, JavaScript, React', 'We are looking for a passionate Frontend Developer Intern to join our team. You will work on real projects and gain hands-on experience in modern web technologies.', 'Certificate, Letter of Recommendation, Flexible Hours', DATE_ADD(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY)),
(1, 'Data Science Intern', 'Data Science', 'in-office', 'Bangalore', 15000, 25000, '6 months', 2, 'Python, Pandas, Machine Learning, SQL', 'Join our data team and work on cutting-edge machine learning projects. You will analyze data, build models, and help drive business decisions.', 'Certificate, Pre-Placement Offer, Meals', DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY)),
(1, 'Digital Marketing Intern', 'Digital Marketing', 'hybrid', 'Mumbai', 8000, 12000, '2 months', 5, 'Social Media, SEO, Content Writing, Google Analytics', 'Looking for a creative Digital Marketing Intern to help grow our online presence across multiple platforms.', 'Certificate, Flexible Hours, Letter of Recommendation', DATE_ADD(CURDATE(), INTERVAL 25 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY));

-- Insert sample jobs
INSERT INTO jobs (company_id, title, category, type, location, work_mode, salary_min, salary_max, experience, skills_required, description, qualifications, apply_by, openings) VALUES
(1, 'Full Stack Developer', 'Web Development', 'full-time', 'Bangalore', 'hybrid', 600000, 1200000, '1-3 years', 'Node.js, React, MySQL, Git', 'We are hiring a Full Stack Developer to build and maintain our core platform. You will work with modern technologies and be part of an agile team.', 'B.Tech/MCA in Computer Science or equivalent. Experience with MERN stack preferred.', DATE_ADD(CURDATE(), INTERVAL 45 DAY), 2),
(1, 'Data Analyst', 'Data Science', 'full-time', 'Hyderabad', 'in-office', 500000, 900000, '0-2 years', 'SQL, Python, Tableau, Excel', 'Join our analytics team to help make data-driven decisions. You will create dashboards, analyze trends, and present insights to stakeholders.', 'Bachelor degree in Statistics, Mathematics, or Computer Science. Strong analytical skills required.', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 3);