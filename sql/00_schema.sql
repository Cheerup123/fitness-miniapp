-- ============================================
-- 运动健身助手小程序 - 完整建表语句
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4
-- ============================================

-- 用户表
CREATE TABLE `user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '微信openid',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
  `nickname` VARCHAR(64) DEFAULT NULL COMMENT '昵称',
  `avatar_url` VARCHAR(512) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别: 0-未知 1-男 2-女',
  `birthday` DATE DEFAULT NULL COMMENT '生日',
  `height_cm` DECIMAL(5,1) DEFAULT NULL COMMENT '身高(cm)',
  `current_weight_kg` DECIMAL(5,2) DEFAULT NULL COMMENT '当前体重(kg)',
  `target_weight_kg` DECIMAL(5,2) DEFAULT NULL COMMENT '目标体重(kg)',
  `fitness_goal` VARCHAR(32) DEFAULT NULL COMMENT '健身目标: lose_fat/gain_muscle/keep_fit/improve_endurance',
  `fitness_level` VARCHAR(32) DEFAULT 'beginner' COMMENT '健身水平: beginner/intermediate/advanced',
  `workout_days_per_week` TINYINT DEFAULT 3 COMMENT '每周训练天数',
  `workout_duration_min` TINYINT DEFAULT 45 COMMENT '每次训练时长(分钟)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_unionid` (`unionid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 身体部位
CREATE TABLE `body_part` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(32) NOT NULL COMMENT '部位名称',
  `icon_url` VARCHAR(512) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='身体部位';

-- 动作分类
CREATE TABLE `exercise_category` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL COMMENT '分类名称',
  `parent_id` INT UNSIGNED DEFAULT NULL COMMENT '父分类',
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动作分类';

-- 运动动作表
CREATE TABLE `exercise` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(128) NOT NULL COMMENT '动作名称',
  `name_en` VARCHAR(128) DEFAULT NULL COMMENT '英文名',
  `category_id` INT UNSIGNED DEFAULT NULL COMMENT '分类ID',
  `difficulty` VARCHAR(32) DEFAULT 'beginner' COMMENT '难度',
  `exercise_type` VARCHAR(32) NOT NULL COMMENT '类型: strength/cardio/flexibility/balance',
  `equipment` VARCHAR(64) DEFAULT NULL COMMENT '所需器械: none/dumbbell/barbell/machine/cable/band',
  `description` TEXT COMMENT '动作描述',
  `instructions` JSON DEFAULT NULL COMMENT '动作步骤(数组)',
  `tips` JSON DEFAULT NULL COMMENT '注意事项(数组)',
  `demo_image_url` VARCHAR(512) DEFAULT NULL COMMENT '演示图',
  `demo_video_url` VARCHAR(512) DEFAULT NULL COMMENT '演示视频',
  `calories_per_rep` DECIMAL(5,2) DEFAULT NULL COMMENT '每次消耗热量(kcal)',
  `calories_per_min` DECIMAL(5,2) DEFAULT NULL COMMENT '每分钟消耗热量(有氧)',
  `is_compound` TINYINT(1) DEFAULT 0 COMMENT '是否复合动作',
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_type` (`exercise_type`),
  KEY `idx_name` (`name`),
  CONSTRAINT `fk_exercise_cat` FOREIGN KEY (`category_id`) REFERENCES `exercise_category`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运动动作库';

-- 动作-部位关联(多对多)
CREATE TABLE `exercise_body_part` (
  `exercise_id` BIGINT UNSIGNED NOT NULL,
  `body_part_id` INT UNSIGNED NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否主要目标肌群',
  PRIMARY KEY (`exercise_id`, `body_part_id`),
  CONSTRAINT `fk_ebp_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ebp_part` FOREIGN KEY (`body_part_id`) REFERENCES `body_part`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动作-部位关联';

-- 训练计划模板
CREATE TABLE `workout_plan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(128) NOT NULL COMMENT '计划名称',
  `description` TEXT COMMENT '计划描述',
  `cover_image_url` VARCHAR(512) DEFAULT NULL COMMENT '封面图',
  `difficulty_level` VARCHAR(32) NOT NULL DEFAULT 'beginner' COMMENT '难度: beginner/intermediate/advanced',
  `fitness_goal` VARCHAR(32) NOT NULL COMMENT '适用目标: lose_fat/gain_muscle/keep_fit',
  `duration_weeks` TINYINT UNSIGNED NOT NULL COMMENT '计划周期(周)',
  `days_per_week` TINYINT UNSIGNED NOT NULL COMMENT '每周训练天数',
  `avg_duration_min` TINYINT UNSIGNED DEFAULT NULL COMMENT '平均每次时长(分钟)',
  `is_system` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否系统预设',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建者用户ID(NULL=系统)',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态: 0-下架 1-上架',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goal_level` (`fitness_goal`, `difficulty_level`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='训练计划模板';

-- 计划中的每日安排
CREATE TABLE `plan_day` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `plan_id` BIGINT UNSIGNED NOT NULL COMMENT '所属计划ID',
  `week_number` TINYINT UNSIGNED NOT NULL COMMENT '第几周',
  `day_of_week` TINYINT UNSIGNED NOT NULL COMMENT '星期几(1-7)',
  `day_label` VARCHAR(32) DEFAULT NULL COMMENT '如"胸+三头"、"休息日"',
  `is_rest_day` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否休息日',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_plan_week` (`plan_id`, `week_number`),
  CONSTRAINT `fk_plan_day_plan` FOREIGN KEY (`plan_id`) REFERENCES `workout_plan`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计划每日安排';

-- 每日训练中的具体动作
CREATE TABLE `plan_exercise` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `plan_day_id` BIGINT UNSIGNED NOT NULL,
  `exercise_id` BIGINT UNSIGNED NOT NULL COMMENT '动作ID',
  `sets` TINYINT UNSIGNED DEFAULT NULL COMMENT '组数',
  `reps` VARCHAR(32) DEFAULT NULL COMMENT '次数(如"12"或"8-12")',
  `duration_sec` INT UNSIGNED DEFAULT NULL COMMENT '时长(秒)，有氧用',
  `rest_sec` TINYINT UNSIGNED DEFAULT 60 COMMENT '组间休息(秒)',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `notes` VARCHAR(256) DEFAULT NULL COMMENT '备注提示',
  PRIMARY KEY (`id`),
  KEY `idx_day` (`plan_day_id`),
  KEY `idx_exercise` (`exercise_id`),
  CONSTRAINT `fk_pe_plan_day` FOREIGN KEY (`plan_day_id`) REFERENCES `plan_day`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计划动作详情';

-- 训练记录主表
CREATE TABLE `workout_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `plan_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联计划(自由训练为NULL)',
  `plan_day_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联计划日',
  `workout_date` DATE NOT NULL COMMENT '训练日期',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `duration_min` INT UNSIGNED DEFAULT NULL COMMENT '实际时长(秒)',
  `total_volume_kg` DECIMAL(10,2) DEFAULT 0 COMMENT '总训练量(kg)',
  `total_sets` INT UNSIGNED DEFAULT 0 COMMENT '总组数',
  `estimated_calories` DECIMAL(8,2) DEFAULT 0 COMMENT '估算消耗(kcal)',
  `notes` TEXT COMMENT '训练备注',
  `feeling_score` TINYINT DEFAULT NULL COMMENT '训练感受 1-5',
  `status` VARCHAR(16) NOT NULL DEFAULT 'in_progress' COMMENT 'in_progress/completed/cancelled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`, `workout_date`),
  KEY `idx_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_wl_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='训练记录';

-- 训练记录详情(每个动作一条)
CREATE TABLE `workout_log_exercise` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workout_log_id` BIGINT UNSIGNED NOT NULL,
  `exercise_id` BIGINT UNSIGNED NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_log` (`workout_log_id`),
  CONSTRAINT `fk_wle_log` FOREIGN KEY (`workout_log_id`) REFERENCES `workout_log`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wle_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='训练记录-动作';

-- 每组记录
CREATE TABLE `workout_log_set` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `log_exercise_id` BIGINT UNSIGNED NOT NULL,
  `set_number` TINYINT UNSIGNED NOT NULL COMMENT '第几组',
  `set_type` VARCHAR(16) DEFAULT 'normal' COMMENT 'normal/warmup/dropset/failure',
  `weight_kg` DECIMAL(6,2) DEFAULT NULL COMMENT '重量(kg)',
  `reps` INT UNSIGNED DEFAULT NULL COMMENT '次数',
  `duration_sec` INT UNSIGNED DEFAULT NULL COMMENT '时长(秒),有氧用',
  `distance_m` DECIMAL(10,2) DEFAULT NULL COMMENT '距离(米),跑步用',
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成',
  `is_pr` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否个人记录',
  `notes` VARCHAR(256) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_log_exercise` (`log_exercise_id`),
  CONSTRAINT `fk_wls_le` FOREIGN KEY (`log_exercise_id`) REFERENCES `workout_log_exercise`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='训练记录-组数';

-- 身体数据记录
CREATE TABLE `body_metric` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `record_date` DATE NOT NULL COMMENT '记录日期',
  `weight_kg` DECIMAL(5,2) DEFAULT NULL COMMENT '体重(kg)',
  `body_fat_pct` DECIMAL(4,1) DEFAULT NULL COMMENT '体脂率(%)',
  `muscle_mass_kg` DECIMAL(5,2) DEFAULT NULL COMMENT '肌肉量(kg)',
  `bmi` DECIMAL(4,1) DEFAULT NULL COMMENT 'BMI',
  `chest_cm` DECIMAL(5,1) DEFAULT NULL COMMENT '胸围(cm)',
  `waist_cm` DECIMAL(5,1) DEFAULT NULL COMMENT '腰围(cm)',
  `hip_cm` DECIMAL(5,1) DEFAULT NULL COMMENT '臀围(cm)',
  `left_arm_cm` DECIMAL(5,1) DEFAULT NULL COMMENT '左臂围(cm)',
  `right_arm_cm` DECIMAL(5,1) DEFAULT NULL COMMENT '右臂围(cm)',
  `left_thigh_cm` DECIMAL(5,1) DEFAULT NULL COMMENT '左大腿围(cm)',
  `right_thigh_cm` DECIMAL(5,1) DEFAULT NULL COMMENT '右大腿围(cm)',
  `note` VARCHAR(256) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `record_date`),
  CONSTRAINT `fk_bm_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='身体数据记录';

-- 打卡记录
CREATE TABLE `checkin` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `checkin_date` DATE NOT NULL COMMENT '打卡日期',
  `workout_log_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联训练记录',
  `checkin_type` VARCHAR(16) NOT NULL DEFAULT 'workout' COMMENT 'workout/rest/custom',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `checkin_date`),
  CONSTRAINT `fk_ci_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打卡记录';

-- 成就配置
CREATE TABLE `achievement` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL COMMENT '成就名称',
  `description` VARCHAR(256) DEFAULT NULL,
  `icon_url` VARCHAR(512) DEFAULT NULL,
  `condition_type` VARCHAR(32) NOT NULL COMMENT '条件类型: total_workouts/streak_days/total_volume/total_duration',
  `condition_value` INT UNSIGNED NOT NULL COMMENT '条件值',
  `badge_color` VARCHAR(16) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就配置';

-- 用户成就
CREATE TABLE `user_achievement` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `achievement_id` INT UNSIGNED NOT NULL,
  `unlocked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievement` (`user_id`, `achievement_id`),
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`),
  CONSTRAINT `fk_ua_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户已解锁成就';

-- 社区动态
CREATE TABLE `post` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL COMMENT '动态内容',
  `images` JSON DEFAULT NULL COMMENT '图片URL数组',
  `workout_log_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联训练记录',
  `like_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `comment_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0-隐藏 1-正常',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区动态';

-- 点赞
CREATE TABLE `post_like` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_user` (`post_id`, `user_id`),
  CONSTRAINT `fk_pl_post` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pl_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞记录';

-- 评论
CREATE TABLE `comment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `parent_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '回复的评论ID',
  `content` VARCHAR(512) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post` (`post_id`),
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论';

-- 系统配置
CREATE TABLE `sys_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_key` VARCHAR(64) NOT NULL,
  `config_value` TEXT NOT NULL,
  `description` VARCHAR(256) DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置';

-- 用户收藏动作
CREATE TABLE `user_favorite_exercise` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `exercise_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_exercise` (`user_id`, `exercise_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_ufe_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ufe_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏动作';

-- 成就配置
CREATE TABLE `achievement` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL COMMENT '成就名称',
  `description` VARCHAR(256) DEFAULT NULL,
  `icon` VARCHAR(16) DEFAULT '🏅' COMMENT '成就图标emoji',
  `category` VARCHAR(32) NOT NULL DEFAULT 'workout' COMMENT '分类: workout/streak/volume/special',
  `condition_type` VARCHAR(32) NOT NULL COMMENT '条件类型: total_workouts/streak_days/total_volume/total_duration',
  `condition_value` INT UNSIGNED NOT NULL COMMENT '条件值',
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就配置';

-- 用户成就
CREATE TABLE `user_achievement` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `achievement_id` INT UNSIGNED NOT NULL,
  `unlocked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievement` (`user_id`, `achievement_id`),
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ua_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievement`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户已解锁成就';

-- ============================================
-- AI 健身助手相关表
-- ============================================

-- 知识库
CREATE TABLE `knowledge_base` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `category` VARCHAR(50) DEFAULT 'common_knowledge' COMMENT '分类: exercise/nutrition/recovery/training_theory/common_knowledge',
  `tags` JSON DEFAULT NULL COMMENT '标签列表',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `useful_count` INT NOT NULL DEFAULT 0 COMMENT '被认为有用的次数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_useful_count` (`useful_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库';

-- 用户健身档案
CREATE TABLE `user_fitness_profile` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL UNIQUE COMMENT '用户ID',
  `injury_history` JSON DEFAULT NULL COMMENT '伤病史列表',
  `available_equipment` JSON DEFAULT NULL COMMENT '可用器械列表',
  `health_conditions` JSON DEFAULT NULL COMMENT '健康状况列表',
  `training_preferences` JSON DEFAULT NULL COMMENT '训练偏好列表',
  `fitness_level` VARCHAR(20) DEFAULT 'beginner' COMMENT '健身水平: beginner/intermediate/advanced',
  `body_type` VARCHAR(20) DEFAULT 'normal' COMMENT '体型: ectomorph/mesomorph/endomorph/normal',
  `primary_goal` VARCHAR(50) DEFAULT 'maintain' COMMENT '主要目标: gain_muscle/lose_fat/maintain/improve_health',
  `weekly_available_days` TINYINT DEFAULT 3 COMMENT '每周可用训练天数',
  `preferred_workout_duration` INT DEFAULT 60 COMMENT '偏好训练时长(分钟)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  CONSTRAINT `fk_ufp_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户健身档案';

-- AI 聊天会话
CREATE TABLE `ai_chat_session` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `session_type` VARCHAR(50) DEFAULT 'chat' COMMENT '会话类型: chat/plan_consult/exercise_advice',
  `title` VARCHAR(255) DEFAULT NULL COMMENT '会话标题',
  `last_message` TEXT DEFAULT NULL COMMENT '最后一条消息',
  `last_message_time` DATETIME DEFAULT NULL COMMENT '最后消息时间',
  `message_count` INT NOT NULL DEFAULT 0 COMMENT '消息数量',
  `context_summary` TEXT DEFAULT NULL COMMENT '上下文摘要',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否活跃',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_is_active` (`is_active`),
  CONSTRAINT `fk_acs_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI聊天会话';

-- AI 聊天消息
CREATE TABLE `ai_chat_message` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `session_id` BIGINT UNSIGNED NOT NULL COMMENT '会话ID',
  `role` VARCHAR(20) NOT NULL COMMENT '角色: user/assistant/system',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `message_type` VARCHAR(50) DEFAULT 'text' COMMENT '消息类型: text/card/plan',
  `tokens_used` INT NOT NULL DEFAULT 0 COMMENT '使用的token数',
  `model` VARCHAR(100) DEFAULT NULL COMMENT '使用的模型',
  `referenced_exercises` JSON DEFAULT NULL COMMENT '引用的动作列表',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_acm_session` FOREIGN KEY (`session_id`) REFERENCES `ai_chat_session`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI聊天消息';

-- AI 生成的训练计划
CREATE TABLE `ai_plan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `session_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联AI会话ID',
  `plan_name` VARCHAR(128) NOT NULL COMMENT '计划名称',
  `plan_description` TEXT DEFAULT NULL COMMENT '计划描述',
  `goal` VARCHAR(50) NOT NULL COMMENT '目标: gain_muscle/lose_fat/maintain',
  `fitness_level` VARCHAR(20) NOT NULL COMMENT '健身水平',
  `days_per_week` TINYINT NOT NULL COMMENT '每周训练天数',
  `duration_weeks` TINYINT NOT NULL COMMENT '计划周期(周)',
  `plan_data` JSON NOT NULL COMMENT '计划详情JSON',
  `explanation` TEXT DEFAULT NULL COMMENT 'AI生成的计划解释',
  `differentiation_matrix` JSON DEFAULT NULL COMMENT '分化方案矩阵',
  `is_confirmed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已确认采纳',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否当前活跃计划',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_is_active` (`is_active`),
  CONSTRAINT `fk_ap_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI生成的训练计划';

-- 计划负荷调整记录
CREATE TABLE `plan_load_adjustment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `ai_plan_id` BIGINT UNSIGNED NOT NULL COMMENT 'AI计划ID',
  `week_number` TINYINT NOT NULL COMMENT '第几周',
  `adjustment_type` VARCHAR(20) NOT NULL COMMENT '调整类型: increase/maintain/decrease/deload',
  `adjustment_reason` VARCHAR(255) DEFAULT NULL COMMENT '调整原因',
  `avg_completion_rate` DECIMAL(4,1) DEFAULT NULL COMMENT '平均完成率(%)',
  `avg_rpe` DECIMAL(3,1) DEFAULT NULL COMMENT '平均RPE',
  `volume_change_pct` INT DEFAULT 0 COMMENT '训练量变化百分比',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ai_plan_id` (`ai_plan_id`),
  CONSTRAINT `fk_pla_plan` FOREIGN KEY (`ai_plan_id`) REFERENCES `ai_plan`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计划负荷调整记录';

-- 周训练总结
CREATE TABLE `weekly_training_summary` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `week_start_date` DATE NOT NULL COMMENT '周开始日期',
  `ai_plan_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联AI计划ID',
  `total_workouts` INT NOT NULL DEFAULT 0 COMMENT '训练次数',
  `total_duration_min` INT DEFAULT 0 COMMENT '总训练时长(分钟)',
  `total_volume_kg` DECIMAL(10,2) DEFAULT 0 COMMENT '总训练量(kg)',
  `total_calories` INT DEFAULT 0 COMMENT '总消耗卡路里',
  `avg_completion_rate` DECIMAL(4,1) DEFAULT NULL COMMENT '平均完成率(%)',
  `avg_feeling_score` DECIMAL(3,1) DEFAULT NULL COMMENT '平均感受评分',
  `workout_days_completed` TINYINT DEFAULT 0 COMMENT '完成训练天数',
  `notes` TEXT DEFAULT NULL COMMENT '总结备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_week` (`user_id`, `week_start_date`),
  INDEX `idx_ai_plan_id` (`ai_plan_id`),
  CONSTRAINT `fk_wts_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='周训练总结';
