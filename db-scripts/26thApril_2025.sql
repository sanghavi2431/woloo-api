ALTER TABLE users
ADD COLUMN shop_password VARCHAR(255),
ADD COLUMN isRegister BOOLEAN DEFAULT FALSE;


CREATE TABLE blog_comments (
  id INT NOT NULL AUTO_INCREMENT,
  blog_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


CREATE TABLE blocked_blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  blog_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_blog (user_id, blog_id)
);
