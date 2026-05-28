# 运动健身助手小程序 — 产品需求文档 (PRD)

> **版本**: v1.1  
> **日期**: 2026-05-28  
> **技术栈**: 微信小程序 + 微信云开发 (Cloudbase) + 云数据库 MySQL  
> **变更记录**: v1.1 — 新增 AI 对话式健身助手、AI 个性化训练计划生成模块

---

## 一、项目概述

### 1.1 产品定位

面向大众健身用户的微信小程序，提供运动计划制定、训练记录、身体数据追踪、社区互动、**AI 智能助手**等功能，帮助用户科学健身、养成运动习惯。

### 1.2 目标用户

| 用户群体 | 特征 | 核心需求 |
|---------|------|---------|
| 健身新手 | 缺乏系统训练知识 | 引导式训练计划、动作教学 |
| 有经验用户 | 有训练习惯，需要记录 | 训练日志、数据分析、进阶计划 |
| 减脂/增肌人群 | 有明确目标 | 目标追踪、饮食建议、体围记录 |
| **知识匮乏用户** | **不懂训练原理，容易受伤** | **AI 问答、可信知识输出** |
| **计划迷茫用户** | **不知道怎么安排训练** | **AI 自动生成个性化计划** |

### 1.3 核心价值

- **科学计划**：根据用户目标自动生成训练计划
- **数据追踪**：体重、体脂、体围等身体数据可视化
- **训练记录**：每次训练详细记录与统计
- **习惯养成**：打卡机制 + 连续训练天数激励
- **AI 智能**：对话式健身助手 + 个性化计划生成，降低健身门槛

---

## 二、技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────┐
│                  微信小程序 (前端)                  │
│  WXML + WXSS + JS / 可选 TS + Vant Weapp 组件库   │
└───────────────────────┬─────────────────────────┘
                        │ wx.cloud.callFunction()
                        ▼
┌─────────────────────────────────────────────────┐
│              微信云开发 (Cloudbase)                │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐│
│  │  云函数层    │  │  云数据库     │  │ 云存储   ││
│  │  Node.js    │  │  MySQL 8.0   │  │ 图片/视频││
│  │  (业务逻辑) │←→│  (SQL型)     │  │ (静态资源)││
│  └──────┬──────┘  └──────────────┘  └──────────┘│
│         │                                        │
│  ┌──────▼──────┐  ┌──────────────┐              │
│  │  AI 服务层   │  │  向量数据库   │              │
│  │  LLM API    │←→│  (RAG 检索)  │              │
│  │  Embedding  │  │  动作/知识库  │              │
│  └─────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────┘
```

### 2.2 技术选型说明

| 层级 | 技术方案 | 说明 |
|------|---------|------|
| 前端框架 | 原生小程序 + Vant Weapp | 轻量、性能好、组件丰富 |
| 云函数 | Node.js 16+ | 云开发原生支持，冷启动快 |
| 数据库 | 云数据库 MySQL (SQL型) | 支持复杂查询、事务、JOIN |
| 文件存储 | 云存储 (COS) | 图片、视频等静态资源 |
| 鉴权 | 微信登录 + 云开发自定义登录 | 基于 openid 的用户体系 |
| **AI 大模型** | **LLM API (如 GPT-4o / 混元 / 文心)** | **对话生成、计划生成** |
| **向量数据库** | **Milvus / Tencent Cloud VectorDB** | **RAG 语义检索** |
| **Embedding** | **文本向量化模型** | **动作库/知识库向量化** |

### 2.3 云数据库 MySQL 连接方式

通过云函数连接 Cloudbase 提供的 MySQL 实例：

```javascript
// 云函数示例 - db/index.js
const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,       // Cloudbase 内网地址
      port: 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

module.exports = { getPool };
```

---

## 三、功能模块详细设计

### 3.1 用户模块

#### 3.1.1 功能列表

| 功能 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| 微信一键登录 | 基于 wx.login 获取 openid | P0 | ✅ 已完成 |
| 个人信息设置 | 性别、年龄、身高、体重、健身目标 | P0 | ✅ 已完成 |
| 个人主页 | 训练统计、成就徽章、历史记录入口 | P1 | ✅ 已完成 |
| 身体数据档案 | BMI 自动计算、目标体重设定 | P1 | ✅ 已完成 |

#### 3.1.2 数据库设计 — 用户表

```sql
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
```

---

### 3.2 训练计划模块

#### 3.2.1 功能列表

| 功能 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| 计划推荐 | 根据用户目标/水平推荐训练计划 | P0 | ✅ 已完成 |
| 自定义计划 | 用户自主创建训练计划 | P0 | ⏳ 待开发 |
| 计划详情 | 展示每日训练动作、组数、次数 | P0 | ✅ 已完成 |
| 计划切换/暂停 | 支持切换计划或暂停当前计划 | P1 | ⏳ 待开发 |
| 计划日历视图 | 日历形式展示本周/本月计划安排 | P1 | ⏳ 待开发 |

#### 3.2.2 数据库设计

```sql
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
  `ai_generated` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否AI生成',
  `ai_generation_params` JSON DEFAULT NULL COMMENT 'AI生成参数快照',
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
```

---

### 3.3 运动动作库

#### 3.3.1 功能列表

| 功能 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| 动作浏览 | 按部位/类型筛选浏览 | P0 | ✅ 已完成 |
| 动作详情 | 动图/视频演示、目标肌群、动作要领 | P0 | ✅ 已完成 |
| 动作搜索 | 关键词搜索动作 | P1 | ✅ 已完成 |
| 收藏动作 | 用户收藏常用动作 | P2 | ⏳ 待开发 |

#### 3.3.2 数据库设计

```sql
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
```

---

### 3.4 训练记录模块

#### 3.4.1 功能列表

| 功能 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| 开始训练 | 从计划进入或自由训练 | P0 | ✅ 已完成 |
| 训练中记录 | 逐组记录重量、次数 | P0 | ✅ 已完成 |
| 训练计时 | 组间休息倒计时 | P0 | ✅ 已完成 |
| 训练完成 | 汇总本次训练数据 | P0 | ✅ 已完成 |
| 历史记录 | 按日历/列表查看历史 | P0 | ✅ 已完成 |
| 训练统计 | 周/月训练次数、总时长、消耗 | P1 | ✅ 已完成 |
| PR记录 | 个人最佳重量/次数记录 | P2 | ⏳ 待开发 |

#### 3.4.2 数据库设计

```sql
-- 训练记录主表(每次训练一条)
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
  `rpe` TINYINT DEFAULT NULL COMMENT '主观疲劳度 RPE 1-10',
  `status` VARCHAR(16) NOT NULL DEFAULT 'in_progress' COMMENT 'in_progress/completed/cancelled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`, `workout_date`),
  KEY `idx_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_wl_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='训练记录';

-- 训练记录详情(每个动作一组记录)
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
```

---

### 3.5 身体数据追踪模块

#### 3.5.1 功能列表

| 功能 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| 体重记录 | 每日记录体重，支持趋势图 | P0 | ✅ 已完成 |
| 体脂率记录 | 记录体脂百分比 | P1 | ✅ 已完成 |
| 体围记录 | 胸围/腰围/臀围/臂围/腿围 | P1 | ✅ 已完成 |
| 数据图表 | 折线图、趋势对比 | P0 | ✅ 已完成 |
| 里程碑 | 达成目标时自动标记 | P2 | ⏳ 待开发 |

#### 3.5.2 数据库设计

```sql
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
```

---

### 3.6 打卡与习惯养成模块

#### 3.6.1 功能列表

| 功能 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| 每日打卡 | 完成训练自动打卡 | P0 | ✅ 已完成 |
| 连续天数 | 显示连续训练天数 | P0 | ✅ 已完成 |
| 周/月统计 | 训练频率统计 | P1 | ✅ 已完成 |
| 成就徽章 | 累计训练次数/天数里程碑 | P2 | ⏳ 待开发 |
| 训练提醒 | 设置每日提醒时间 | P1 | ⏳ 待开发 |

#### 3.6.2 数据库设计

```sql
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
```

---

### 3.7 社区互动模块 (P2)

#### 3.7.1 功能列表

| 功能 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| 训练分享 | 将训练成果分享到社区 | P2 | ⏳ 待开发 |
| 动态流 | 关注/推荐动态列表 | P2 | ⏳ 待开发 |
| 点赞/评论 | 基础互动功能 | P2 | ⏳ 待开发 |

#### 3.7.2 数据库设计

```sql
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
```

---

### 3.8 系统配置模块

```sql
-- 系统配置(如推荐算法参数、全局开关等)
CREATE TABLE `sys_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `config_key` VARCHAR(64) NOT NULL,
  `config_value` TEXT NOT NULL,
  `description` VARCHAR(256) DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置';
```

---

### 3.9 AI 对话式健身助手 🆕

#### 3.9.1 功能概述

用户通过自然语言与 AI 健身助手对话，获取专业健身知识、训练建议、动作指导。基于 RAG（检索增强生成）架构，从动作库和训练知识库中召回可信内容，避免 LLM 幻觉，确保回答的专业性和准确性。

#### 3.9.2 用户场景

| 场景 | 用户输入示例 | 期望输出 |
|------|------------|---------|
| 新手入门 | "我是新手，想减脂但没器械，怎么安排？" | 无器械减脂计划 + 动作推荐卡片 |
| 恢复咨询 | "昨天练了胸，今天浑身疼正常吗？" | DOMS 解释 + 恢复建议 |
| 动作替代 | "没有杠铃，深蹲可以用什么替代？" | 替代动作列表（可点击跳转详情） |
| 营养建议 | "增肌期每天要吃多少蛋白质？" | 蛋白质摄入计算 + 食物举例 |
| 计划解读 | "为什么我计划里没有单独练手臂？" | 解释复合动作已覆盖 + 可选手臂补充方案 |

#### 3.9.3 功能列表

| 功能 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| AI 对话 | 自然语言问答，支持多轮对话 | P0 | ⏳ 待开发 |
| RAG 知识召回 | 从动作库/训练知识库检索相关内容 | P0 | ⏳ 待开发 |
| 用户画像记忆 | 记忆用户目标、伤病史、可用器械等 | P0 | ⏳ 待开发 |
| 结构化输出 | 回答中嵌入「计划卡片」「动作卡片」可跳转 | P1 | ⏳ 待开发 |
| 对话历史 | 保存历史对话，支持回看 | P1 | ⏳ 待开发 |
| 反馈机制 | 用户可对回答「有用/无用」反馈 | P2 | ⏳ 待开发 |
| 安全过滤 | 过滤医疗诊断、极端节食等不安全建议 | P0 | ⏳ 待开发 |

#### 3.9.4 系统架构

```
┌──────────────────────────────────────────────────────────┐
│                    小程序前端                              │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────────┐│
│  │ 对话界面  │  │ 消息气泡  │  │ 结构化卡片(计划/动作)    ││
│  └────┬─────┘  └──────────┘  └─────────────────────────┘│
│       │ wx.cloud.callFunction('ai-chat')                 │
└───────┼──────────────────────────────────────────────────┘
        ▼
┌──────────────────────────────────────────────────────────┐
│                 云函数 ai-chat                            │
│                                                          │
│  1. 加载用户画像 (user_profile)                           │
│  2. RAG 检索                                               │
│     ├─ 向量化用户 query (Embedding API)                    │
│     ├─ 检索动作库 (exercise_vector)                        │
│     ├─ 检索知识库 (knowledge_vector)                       │
│     └─ 返回 Top-K 相关片段                                 │
│  3. 构建 Prompt                                            │
│     ├─ System: 角色设定 + 安全约束                         │
│     ├─ Context: RAG 召回的知识片段                         │
│     ├─ User Profile: 用户画像摘要                         │
│     └─ History: 近 N 轮对话                               │
│  4. 调用 LLM API                                           │
│  5. 解析响应 → 提取结构化数据 → 生成卡片                   │
│  6. 保存对话 + 更新用户画像                                │
└──────────────────────────────────────────────────────────┘
```

#### 3.9.5 RAG 知识库设计

**知识来源：**

| 来源 | 内容 | 向量化策略 |
|------|------|-----------|
| 动作库 (`exercise`) | 动作名称、描述、步骤、注意事项、适用人群 | 每个动作一条向量 |
| 训练知识库 (`knowledge_base`) | 训练原理、恢复方法、营养知识、常见问题 | 按段落切分向量化 |
| 计划模板 (`workout_plan`) | 计划描述、适用场景、分化方案 | 每个计划一条向量 |

#### 3.9.6 数据库设计

```sql
-- AI 对话记录
CREATE TABLE `ai_chat_session` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(128) DEFAULT NULL COMMENT '会话标题(首条消息摘要)',
  `status` VARCHAR(16) NOT NULL DEFAULT 'active' COMMENT 'active/archived',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_acs_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话会话';

-- AI 对话消息
CREATE TABLE `ai_chat_message` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT UNSIGNED NOT NULL,
  `role` VARCHAR(16) NOT NULL COMMENT 'user/assistant/system',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `rag_refs` JSON DEFAULT NULL COMMENT 'RAG 引用来源(动作ID/知识ID)',
  `structured_data` JSON DEFAULT NULL COMMENT '结构化数据(卡片内容)',
  `token_count` INT UNSIGNED DEFAULT NULL COMMENT '消耗 token 数',
  `feedback` TINYINT DEFAULT NULL COMMENT '用户反馈: 1-有用 -1-无用 NULL-未评价',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `fk_acm_session` FOREIGN KEY (`session_id`) REFERENCES `ai_chat_session`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话消息';

-- 训练知识库
CREATE TABLE `knowledge_base` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(32) NOT NULL COMMENT '分类: training/recovery/nutrition/injury/sleep',
  `title` VARCHAR(256) NOT NULL COMMENT '知识标题',
  `content` TEXT NOT NULL COMMENT '知识内容(Markdown)',
  `tags` JSON DEFAULT NULL COMMENT '标签数组',
  `source` VARCHAR(256) DEFAULT NULL COMMENT '来源(书籍/文献/专家)',
  `vector_id` VARCHAR(128) DEFAULT NULL COMMENT '向量数据库中的ID',
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  FULLTEXT KEY `ft_content` (`title`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='训练知识库';

-- 用户健身画像(AI 维护)
CREATE TABLE `user_fitness_profile` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `injuries` JSON DEFAULT NULL COMMENT '伤病史记录',
  `allergies` JSON DEFAULT NULL COMMENT '过敏信息',
  `available_equipment` JSON DEFAULT NULL COMMENT '可用器械列表',
  `preferred_workout_time` VARCHAR(32) DEFAULT NULL COMMENT '偏好训练时间',
  `training_preferences` JSON DEFAULT NULL COMMENT '训练偏好(喜欢/不喜欢的动作)',
  `health_conditions` JSON DEFAULT NULL COMMENT '健康状况(腰椎间盘突出等)',
  `ai_notes` TEXT DEFAULT NULL COMMENT 'AI 对用户的整体理解摘要',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`),
  CONSTRAINT `fk_ufp_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户健身画像';

-- 向量索引映射表
CREATE TABLE `vector_index` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_type` VARCHAR(32) NOT NULL COMMENT 'exercise/knowledge/plan',
  `source_id` BIGINT UNSIGNED NOT NULL COMMENT '来源表的ID',
  `vector_id` VARCHAR(128) NOT NULL COMMENT '向量数据库中的ID',
  `chunk_text` TEXT DEFAULT NULL COMMENT '向量化的文本片段',
  `embedding_model` VARCHAR(64) DEFAULT NULL COMMENT '使用的 embedding 模型',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_source` (`source_type`, `source_id`),
  KEY `idx_vector` (`vector_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='向量索引映射';
```

#### 3.9.7 Prompt 设计规范

```
System Prompt 模板:

你是「FitBot」，一个专业的 AI 健身助手。

## 角色
- 基于科学训练知识为用户提供健身建议
- 始终以用户安全为第一优先级

## 能力边界
- 可以回答：训练计划、动作指导、营养建议、恢复方法、运动心理学
- 不可以回答：医疗诊断、伤病治疗、药物建议 → 回复"建议咨询专业医生"
- 不确定的内容必须标注"仅供参考"

## 输出规范
- 语言简洁，使用用户能理解的方式
- 涉及具体动作时，输出「动作卡片」结构化数据
- 涉及训练安排时，输出「计划卡片」结构化数据
- 引用知识库内容时，标注来源

## 用户画像
{user_profile_json}

## RAG 召回知识
{rag_context}

## 安全规则
- 不推荐极端节食方案（每日不低于 1200 kcal）
- 不建议未经医生允许带伤训练
- 不推荐使用合成代谢类固醇等禁药
- 建议用户量力而行，出现不适应立即停止
```

#### 3.9.8 云函数设计

| 云函数名 | 功能说明 | 调用方式 |
|----------|---------|---------|
| `ai-chat` | AI 对话主入口 | 小程序端调用 |
| `ai-rag-search` | RAG 向量检索 | 内部调用 |
| `ai-profile-update` | 更新用户健身画像 | 内部调用 |
| `ai-feedback` | 用户反馈处理 | 小程序端调用 |
| `knowledge-index` | 知识库向量化索引 | 管理后台调用 |

---

### 3.10 AI 个性化训练计划生成 🆕

#### 3.10.1 功能概述

基于用户输入的目标、可用器械、每周可练天数、体测数据，由 AI 自动生成科学的周训练计划。计划包含分化方案、组次数、休息时间等完整参数，并提供可解释的排课逻辑。每次训练完成后，根据完成率和主观疲劳度（RPE）动态微调下周负荷，实现渐进式超负荷。

#### 3.10.2 用户场景

| 场景 | 输入 | 输出 |
|------|------|------|
| 新手减脂 | 目标:减脂 / 无器械 / 3天/周 / 体重85kg | 全身训练3天方案 + 有氧建议 |
| 进阶增肌 | 目标:增肌 / 全器械 / 5天/周 / 有训练基础 | 推拉腿5天分化 + 渐进超负荷参数 |
| 产后恢复 | 目标:康复 / 弹力带 / 2天/周 / 有盆底肌问题 | 低强度恢复方案 + 禁忌动作标注 |
| 突破瓶颈 | 目标:增肌 / 哑铃 / 4天/周 / 近3周完成率低 | 降负荷调整 + 新动作替换 |

#### 3.10.3 功能列表

| 功能 | 说明 | 优先级 | 状态 |
|------|------|--------|------|
| AI 计划生成 | 一键生成个性化周计划 | P0 | ⏳ 待开发 |
| 计划可解释 | 展示「为什么这么排」的逻辑说明 | P0 | ⏳ 待开发 |
| 计划预览 | 生成后可预览调整，确认后保存 | P0 | ⏳ 待开发 |
| 动态微调 | 根据完成率/RPE 自动调整下周负荷 | P1 | ⏳ 待开发 |
| 负荷追踪 | 可视化展示每周训练负荷变化趋势 | P1 | ⏳ 待开发 |
| 计划迭代 | 支持手动微调 AI 生成的计划 | P1 | ⏳ 待开发 |
| 多计划管理 | 同时管理多套计划（减脂期/增肌期） | P2 | ⏳ 待开发 |

#### 3.10.4 计划生成流程

```
用户输入                      AI 处理                        输出
─────────                    ────────                       ────
目标(减脂/增肌/   ──┐
  塑形/康复)        │
                    │
可用器械列表    ────┤
(无器械/哑铃/       │        ┌──────────────────┐
  杠铃/全器械)      ├───────→│  AI Plan Engine   │
                    │        │                    │
每周可练天数    ────┤        │  1. 用户画像匹配   │──→ 分化方案选择
                    │        │  2. 分化方案选择   │──→ 动作筛选
体测数据        ────┤        │  3. 动作筛选排序   │──→ 组次安排
(体重/体脂/         │        │  4. 渐进超负荷计算 │──→ 休息时间
  训练经验)         │        │  5. 生成解释说明   │──→ 计划说明
                    │        └────────┬─────────┘
训练历史        ────┘                 │
(完成率/RPE)                         ▼
                              ┌──────────────────┐
                              │  计划预览卡片     │
                              │  [确认] [微调]    │
                              └──────────────────┘
                                       │
                              确认后写入 workout_plan
                                       │
                              ┌────────▼─────────┐
                              │  每周训练完成      │
                              │  → 收集 RPE/完成率 │
                              │  → AI 微调下周负荷 │
                              └──────────────────┘
```

#### 3.10.5 分化方案矩阵

| 每周天数 | 新手推荐 | 进阶推荐 | 高级推荐 |
|---------|---------|---------|---------|
| 2天 | 全身 A/B | 上肢/下肢 | — |
| 3天 | 全身 A/B/C | 推/拉/腿 | 推/拉/腿 |
| 4天 | 上/下 A/B | 上/下 A/B | 背+二头/胸+三头/肩+手臂/腿 |
| 5天 | 全身+有氧 | 推/拉/腿/上肢/下肢 | 推/拉/腿/推/拉 |
| 6天 | — | 推/拉/腿×2 | 推/拉/腿×2 |

#### 3.10.6 动态微调规则

| 指标 | 触发条件 | 调整策略 |
|------|---------|---------|
| 完成率 ≥ 95% + RPE ≤ 7 | 连续 2 周 | 下周增加 2.5-5% 负荷（重量或组数） |
| 完成率 ≥ 95% + RPE 8-9 | 连续 2 周 | 维持当前负荷，优化动作质量 |
| 完成率 < 80% | 单周 | 降低 5-10% 负荷，减少 1 组或替换难度动作 |
| RPE ≥ 10 | 单次 | 标记过度疲劳，建议额外休息日 |
| 完成率 80-95% + RPE 7-8 | 稳定 | 保持当前方案不变 |
| 某动作连续 PR | 进阶超负荷 | 该动作增加重量 2.5kg 或增加 1-2 次 |

#### 3.10.7 数据库设计

```sql
-- AI 生成的计划(含生成参数和解释)
CREATE TABLE `ai_plan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `workout_plan_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联的训练计划(确认后生成)',
  `goal` VARCHAR(32) NOT NULL COMMENT '训练目标',
  `available_equipment` JSON NOT NULL COMMENT '可用器械',
  `days_per_week` TINYINT UNSIGNED NOT NULL COMMENT '每周天数',
  `split_type` VARCHAR(32) NOT NULL COMMENT '分化类型: full_body/upper_lower/push_pull_legs/custom',
  `generation_params` JSON NOT NULL COMMENT '完整生成参数快照',
  `explanation` TEXT NOT NULL COMMENT 'AI 生成的计划解释(为什么这么排)',
  `version` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '计划版本(迭代次数)',
  `status` VARCHAR(16) NOT NULL DEFAULT 'draft' COMMENT 'draft/confirmed/active/archived',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_ap_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI生成的训练计划';

-- 计划每周负荷调整记录
CREATE TABLE `plan_load_adjustment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ai_plan_id` BIGINT UNSIGNED NOT NULL,
  `week_number` TINYINT UNSIGNED NOT NULL COMMENT '第几周',
  `adjustment_type` VARCHAR(32) NOT NULL COMMENT 'increase/maintain/decrease/deload',
  `adjustment_reason` TEXT NOT NULL COMMENT '调整原因(AI 生成)',
  `metrics_snapshot` JSON NOT NULL COMMENT '触发调整的数据快照(avg_rpe, completion_rate)',
  `load_change_pct` DECIMAL(5,2) DEFAULT NULL COMMENT '负荷变化百分比',
  `exercise_changes` JSON DEFAULT NULL COMMENT '动作替换/调整详情',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_plan_week` (`ai_plan_id`, `week_number`),
  CONSTRAINT `fk_pla_plan` FOREIGN KEY (`ai_plan_id`) REFERENCES `ai_plan`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计划负荷调整记录';

-- 每周训练完成统计(用于微调决策)
CREATE TABLE `weekly_training_summary` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `ai_plan_id` BIGINT UNSIGNED DEFAULT NULL,
  `week_start_date` DATE NOT NULL COMMENT '周开始日期',
  `planned_workouts` TINYINT UNSIGNED NOT NULL COMMENT '计划训练天数',
  `completed_workouts` TINYINT UNSIGNED NOT NULL COMMENT '实际完成天数',
  `completion_rate` DECIMAL(5,2) NOT NULL COMMENT '完成率(%)',
  `avg_rpe` DECIMAL(3,1) DEFAULT NULL COMMENT '平均 RPE',
  `total_volume_kg` DECIMAL(12,2) DEFAULT NULL COMMENT '本周总训练量',
  `total_duration_min` INT UNSIGNED DEFAULT NULL COMMENT '本周总时长(分钟)',
  `exercise_stats` JSON DEFAULT NULL COMMENT '各动作完成详情',
  `adjustment_applied` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已应用调整',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_week` (`user_id`, `ai_plan_id`, `week_start_date`),
  CONSTRAINT `fk_wts_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每周训练完成统计';
```

#### 3.10.8 云函数设计

| 云函数名 | 功能说明 | 调用方式 |
|----------|---------|---------|
| `ai-plan-generate` | 生成个性化训练计划 | 小程序端调用 |
| `ai-plan-confirm` | 用户确认计划 → 写入 workout_plan | 小程序端调用 |
| `ai-plan-adjust` | 每周训练完成后自动微调 | 定时触发 / 训练完成触发 |
| `ai-plan-explain` | 生成计划解释说明 | 内部调用 |
| `weekly-summary-calc` | 计算每周训练完成统计 | 定时触发(每周日) |

#### 3.10.9 云函数示例 — 计划生成

```javascript
// cloudfunctions/ai-plan-generate/index.js
const cloud = require('wx-server-sdk');
const { getPool } = require('../db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 分化方案选择逻辑
function selectSplitType(daysPerWeek, fitnessLevel) {
  const matrix = {
    2: { beginner: 'full_body', intermediate: 'upper_lower', advanced: 'upper_lower' },
    3: { beginner: 'full_body', intermediate: 'push_pull_legs', advanced: 'push_pull_legs' },
    4: { beginner: 'upper_lower', intermediate: 'upper_lower', advanced: 'upper_lower' },
    5: { beginner: 'full_body', intermediate: 'push_pull_legs', advanced: 'push_pull_legs' },
    6: { beginner: 'full_body', intermediate: 'push_pull_legs', advanced: 'push_pull_legs' },
  };
  return matrix[daysPerWeek]?.[fitnessLevel] || 'full_body';
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { goal, equipment, daysPerWeek, bodyMetrics } = event;

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    // 1. 获取用户信息和训练历史
    const [users] = await conn.execute(
      'SELECT * FROM user WHERE openid = ?', [OPENID]
    );
    const user = users[0];

    // 2. 获取最近 4 周训练完成统计
    const [weeklyStats] = await conn.execute(
      `SELECT * FROM weekly_training_summary 
       WHERE user_id = ? ORDER BY week_start_date DESC LIMIT 4`,
      [user.id]
    );

    // 3. 获取用户健身画像
    const [profiles] = await conn.execute(
      'SELECT * FROM user_fitness_profile WHERE user_id = ?', [user.id]
    );
    const profile = profiles[0] || {};

    // 4. 选择分化方案
    const splitType = selectSplitType(daysPerWeek, user.fitness_level);

    // 5. 构建 LLM Prompt
    const prompt = buildPlanPrompt({
      user, goal, equipment, daysPerWeek, bodyMetrics,
      splitType, weeklyStats, profile
    });

    // 6. 调用 LLM 生成计划
    const llmResponse = await callLLM(prompt);
    const planData = parsePlanResponse(llmResponse);

    // 7. 写入 ai_plan 表
    const [result] = await conn.execute(
      `INSERT INTO ai_plan 
       (user_id, goal, available_equipment, days_per_week, split_type,
        generation_params, explanation, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [user.id, goal, JSON.stringify(equipment), daysPerWeek, splitType,
       JSON.stringify({ bodyMetrics, weeklyStats: weeklyStats.length }),
       planData.explanation]
    );

    const aiPlanId = result.insertId;

    // 8. 返回计划预览数据(不直接写入 workout_plan，等用户确认)
    return {
      code: 0,
      data: {
        aiPlanId,
        splitType,
        explanation: planData.explanation,
        weeklyPlan: planData.weeklyPlan, // 完整周计划预览
        disclaimer: '本计划由 AI 生成，仅供参考。请根据自身情况调整，如有伤病请咨询专业教练。',
      }
    };
  } catch (err) {
    return { code: -1, message: err.message };
  } finally {
    conn.release();
  }
};
```

#### 3.10.10 计划解释模板

AI 生成的解释将包含以下维度：

```
📋 计划说明 — 为什么这么排？

🎯 分化方案：推/拉/腿 (Push/Pull/Legs)
  → 你每周能练 4 天，推拉腿分化能让每个肌群每周练 2 次，
    这是增肌的最佳训练频率 (Schoenfeld, 2016)。

📅 安排逻辑：
  周一：推 (胸+肩+三头)  → 周末休息后第一天，状态最好，推类动作对上肢整体发展最重要
  周二：拉 (背+二头)      → 与推日相邻，避免胸肌疲劳影响训练质量
  周三：休息              → 中间恢复日，防止过度训练
  周四：腿                → 下肢恢复充分，深蹲/硬拉放在周中
  周五：推+拉 (上肢综合)  → 轻量补充日，增加训练频率
  周末：休息              → 完整恢复

📈 渐进超负荷策略：
  基于你最近 4 周数据，完成率稳定在 90%，RPE 平均 7.5。
  建议：本周主要动作增加 2.5kg，保持组数不变。
  如果下周 RPE 超过 8.5，回退到当前负荷。

⚠️ 注意事项：
  - 你提到有腰椎不适，深蹲/硬拉已替换为高脚杯深蹲和罗马尼亚硬拉
  - 腿弯举替代了传统硬拉，减少腰部压力
```

---

## 四、页面结构设计

### 4.1 小程序页面路由

```
pages/
├── index/                  # 首页(今日计划+快速入口)
├── plan/
│   ├── list                # 计划列表/推荐
│   ├── detail              # 计划详情
│   └── editor              # 自定义计划编辑器
├── workout/
│   ├── start               # 开始训练(执行页)
│   ├── history             # 训练历史
│   └── summary             # 训练完成汇总
├── exercise/
│   ├── list                # 动作库浏览
│   └── detail              # 动作详情
├── body/
│   ├── index               # 身体数据总览
│   └── record              # 记录身体数据
├── profile/
│   ├── index               # 个人中心
│   ├── edit                # 编辑个人信息
│   └── achievements        # 成就墙
├── ai/                     # 🆕 AI 功能
│   ├── chat                # AI 对话助手
│   ├── chat-history        # 对话历史列表
│   ├── plan-generate       # AI 计划生成入口
│   └── plan-preview        # AI 计划预览/确认
└── community/              # 社区(P2)
    ├── index               # 动态流
    └── detail              # 动态详情
```

### 4.2 首页布局

```
┌──────────────────────────────┐
│  👋 早上好, [用户名]          │  ← 问候 + 连续打卡天数
│  🔥 连续训练 5 天             │
├──────────────────────────────┤
│  📅 今日计划: 胸 + 三头       │  ← 今日计划卡片
│  ┌────────────────────────┐  │
│  │  平板卧推 4×12          │  │
│  │  上斜哑铃飞鸟 3×15      │  │
│  │  绳索下压 3×12          │  │
│  │  ────────────────────  │  │
│  │  [ 开始训练 ]           │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│  🤖 AI 助手                   │  ← 🆕 AI 快捷入口
│  [ 问个问题 ] [ 生成计划 ]    │
├──────────────────────────────┤
│  📊 本周概览                   │
│  [一] [二] [三] [四] [五] [六] [日]
│   ✅   ✅   ✅   ◻️   ◻️   ◻️  ◻️
├──────────────────────────────┤
│  ⚡ 快速入口                   │
│  [ 记录体重 ] [ 动作库 ] [ 训练历史 ]
└──────────────────────────────┘
```

### 4.3 AI 对话界面

```
┌──────────────────────────────┐
│  🤖 FitBot 健身助手           │
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │ 我是新手，想减脂但没器械  │  │  ← 用户消息(右对齐)
│  │ 怎么安排？               │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 对于新手减脂，我推荐     │  │  ← AI 回复(左对齐)
│  │ 全身训练 3 天/周：       │  │
│  │                         │  │
│  │ ┌─────────────────────┐ │  │
│  │ │ 📋 减脂全身计划 A     │ │  │  ← 可点击的计划卡片
│  │ │ 徒手深蹲 3×15        │ │  │
│  │ │ 俯卧撑 3×10          │ │  │
│  │ │ 平板支撑 3×30秒      │ │  │
│  │ │ [ 查看完整计划 ]      │ │  │
│  │ └─────────────────────┘ │  │
│  │                         │  │
│  │ 💡 为什么这样安排？       │  │  ← 可展开的解释
│  │ 全身训练消耗大，适合减脂  │  │
│  │ 每个肌群每周练3次频率最佳 │  │
│  └────────────────────────┘  │
│                              │
├──────────────────────────────┤
│  [ 输入你的问题...        ] 📎│
└──────────────────────────────┘
```

### 4.4 AI 计划生成界面

```
┌──────────────────────────────┐
│  🤖 AI 计划生成               │
├──────────────────────────────┤
│                              │
│  🎯 训练目标                  │
│  [ 减脂 ] [ 增肌 ✓ ] [ 塑形 ]│
│                              │
│  🏋️ 可用器械 (多选)           │
│  [ 无器械 ] [ 哑铃 ✓ ]        │
│  [ 杠铃 ✓ ] [ 固定器械 ✓ ]    │
│                              │
│  📅 每周可练天数              │
│  [ 2 ] [ 3 ] [ 4 ✓ ] [ 5 ]  │
│                              │
│  📊 体测数据                  │
│  体重: 75kg  体脂: 18%       │
│  训练经验: 1年               │
│                              │
│  ─────────────────────────── │
│  [ 🤖 生成我的计划 ]          │
│                              │
└──────────────────────────────┘
```

### 4.5 AI 计划预览界面

```
┌──────────────────────────────┐
│  📋 你的个性化计划             │
├──────────────────────────────┤
│                              │
│  推/拉/腿 4天分化 · 增肌      │
│                              │
│  📅 周一: 推日 (胸+肩+三头)   │
│  ┌────────────────────────┐  │
│  │ 平板卧推        4×8-10  │  │
│  │ 上斜哑铃卧推    3×10-12 │  │
│  │ 站姿哑铃推肩    3×10-12 │  │
│  │ 绳索下压        3×12-15 │  │
│  └────────────────────────┘  │
│                              │
│  📅 周二: 拉日 (背+二头)      │
│  ┌────────────────────────┐  │
│  │ ...                     │  │
│  └────────────────────────┘  │
│                              │
│  📅 周三: 休息               │
│                              │
│  📅 周四: 腿日               │
│  ┌────────────────────────┐  │
│  │ ...                     │  │
│  └────────────────────────┘  │
│                              │
│  ▶️ 为什么这么排？            │  ← 可展开解释
│  ─────────────────────────── │
│  [ 确认使用 ] [ 重新生成 ]    │
│                              │
└──────────────────────────────┘
```

---

## 五、云函数设计

### 5.1 云函数列表

| 云函数名 | 功能说明 | 调用方式 |
|----------|---------|---------|
| `user-login` | 微信登录、用户注册/更新 | 小程序端调用 |
| `user-update` | 更新用户信息 | 小程序端调用 |
| `plan-list` | 获取计划列表(推荐/我的) | 小程序端调用 |
| `plan-detail` | 获取计划详情(含动作) | 小程序端调用 |
| `plan-create` | 创建自定义计划 | 小程序端调用 |
| `exercise-list` | 获取动作列表(分页/筛选) | 小程序端调用 |
| `exercise-detail` | 获取动作详情 | 小程序端调用 |
| `workout-start` | 开始训练 | 小程序端调用 |
| `workout-log-set` | 记录每组数据 | 小程序端调用 |
| `workout-complete` | 完成训练、计算统计 | 小程序端调用 |
| `workout-history` | 训练历史查询 | 小程序端调用 |
| `body-record` | 记录身体数据 | 小程序端调用 |
| `body-stats` | 身体数据统计 | 小程序端调用 |
| `checkin-daily` | 每日打卡 | 小程序端调用 |
| **`ai-chat`** | **AI 对话健身助手** | **小程序端调用** |
| **`ai-rag-search`** | **RAG 向量检索** | **内部调用** |
| **`ai-profile-update`** | **更新用户健身画像** | **内部调用** |
| **`ai-feedback`** | **用户反馈处理** | **小程序端调用** |
| **`knowledge-index`** | **知识库向量化索引** | **管理后台调用** |
| **`ai-plan-generate`** | **AI 生成个性化计划** | **小程序端调用** |
| **`ai-plan-confirm`** | **确认 AI 计划 → 写入** | **小程序端调用** |
| **`ai-plan-adjust`** | **每周自动微调负荷** | **定时触发** |
| **`weekly-summary-calc`** | **每周训练统计计算** | **定时触发** |
| `community-feed` | 社区动态列表(P2) | 小程序端调用 |

### 5.2 云函数示例 — 开始训练

```javascript
// cloudfunctions/workout-start/index.js
const cloud = require('wx-server-sdk');
const { getPool } = require('../db');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { planId, planDayId } = event;

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. 查询用户
    const [users] = await conn.execute(
      'SELECT id FROM user WHERE openid = ?', [OPENID]
    );
    if (users.length === 0) throw new Error('用户不存在');
    const userId = users[0].id;

    // 2. 创建训练记录
    const now = new Date();
    const [result] = await conn.execute(
      `INSERT INTO workout_log 
       (user_id, plan_id, plan_day_id, workout_date, start_time, status) 
       VALUES (?, ?, ?, CURDATE(), ?, 'in_progress')`,
      [userId, planId || null, planDayId || null, now]
    );
    const workoutLogId = result.insertId;

    // 3. 如果有计划日，加载动作列表
    let exercises = [];
    if (planDayId) {
      const [rows] = await conn.execute(
        `SELECT pe.exercise_id, e.name, pe.sets, pe.reps, pe.rest_sec,
                pe.duration_sec, pe.notes
         FROM plan_exercise pe
         JOIN exercise e ON e.id = pe.exercise_id
         WHERE pe.plan_day_id = ?
         ORDER BY pe.sort_order`,
        [planDayId]
      );
      exercises = rows;

      // 4. 预创建 log_exercise 记录
      for (let i = 0; i < rows.length; i++) {
        await conn.execute(
          `INSERT INTO workout_log_exercise (workout_log_id, exercise_id, sort_order) 
           VALUES (?, ?, ?)`,
          [workoutLogId, rows[i].exercise_id, i]
        );
      }
    }

    await conn.commit();

    return {
      code: 0,
      data: {
        workoutLogId,
        exercises,
        startTime: now,
      }
    };
  } catch (err) {
    await conn.rollback();
    return { code: -1, message: err.message };
  } finally {
    conn.release();
  }
};
```

---

## 六、UI/UX 设计规范

### 6.1 设计风格

- **色彩方案**：主色 `#FF6B35`(活力橙) + 辅助色 `#1A1A2E`(深蓝黑)
- **AI 模块主色**：`#6C5CE7`(AI 紫) — 用于 AI 功能入口和对话界面
- **背景色**：`#F5F5FA` (浅灰)
- **成功色**：`#4CAF50` (绿色)
- **圆角**：16rpx (卡片)、8rpx (按钮)
- **字体**：系统默认字体，标题 36rpx/加粗，正文 28rpx

### 6.2 交互原则

- 训练中页面保持 **屏幕常亮**
- 组间休息提供 **倒计时震动反馈**
- 复杂操作提供 **二次确认**
- 加载态使用 **骨架屏**
- 空状态提供 **引导操作**
- AI 对话提供 **打字机效果** 逐字输出
- AI 生成计划时显示 **加载动画** + 预估时间

---

## 七、非功能性需求

### 7.1 性能指标

| 指标 | 目标值 |
|------|--------|
| 首屏加载 | < 1.5s |
| 云函数响应 | < 500ms (P95) |
| 训练记录写入 | < 200ms |
| 图片加载 | 懒加载 + CDN |
| **AI 对话首字响应** | **< 2s** |
| **AI 计划生成** | **< 15s** |
| **RAG 检索延迟** | **< 300ms** |

### 7.2 数据安全

- 所有用户数据通过 openid 隔离，云函数层做鉴权校验
- 敏感操作(删除/修改)记录日志
- 定期数据库备份(每日)
- MySQL 开启 SSL 连接
- **AI 对话内容加密存储，用户可随时清除**
- **AI 生成的计划数据归属用户，可导出/删除**

### 7.3 兼容性

- 微信版本 ≥ 7.0
- 基础库 ≥ 2.20.0
- iOS / Android 双端适配
- 屏幕尺寸 320px ~ 428px 宽度适配

### 7.4 AI 安全与合规

- AI 回复经过安全过滤，不输出医疗诊断、极端饮食方案、禁药推荐
- 所有 AI 生成内容附带免责声明：「由 AI 生成，仅供参考」
- 用户可举报不当回答，后台审核后更新安全规则
- 符合《生成式人工智能服务管理暂行办法》要求

---

## 八、项目里程碑

| 阶段 | 内容 | 周期 |
|------|------|------|
| **M1 - 基础框架** | 项目搭建、用户模块、数据库初始化 | 2 周 |
| **M2 - 核心功能** | 训练计划、动作库、训练记录 | 3 周 |
| **M3 - 数据追踪** | 身体数据、打卡系统、图表 | 2 周 |
| **M4 - 体验优化** | UI 打磨、性能优化、测试 | 1 周 |
| **M5 - 社区功能** | 分享、动态、互动 (P2) | 2 周 |
| **M6 - AI 智能助手** 🆕 | AI 对话、RAG 知识库、用户画像 | 3 周 |
| **M7 - AI 计划生成** 🆕 | 计划生成引擎、动态微调、负荷追踪 | 2 周 |

---

## 九、ER 图概览

```
user ──1:N── workout_log ──1:N── workout_log_exercise ──1:N── workout_log_set
  │                    │
  │                    └── N:1── exercise ──N:M── body_part
  │                                  │
  ├──1:N── body_metric               └── N:1── exercise_category
  │
  ├──1:N── checkin
  │
  ├──N:M── user_achievement ──N:1── achievement
  │
  ├──1:N── post ──1:N── comment
  │           └──1:N── post_like
  │
  ├──1:N── workout_plan ──1:N── plan_day ──1:N── plan_exercise ──N:1── exercise
  │
  ├──1:N── ai_chat_session ──1:N── ai_chat_message          🆕
  │
  ├──1:1── user_fitness_profile                               🆕
  │
  └──1:N── ai_plan ──1:N── plan_load_adjustment              🆕
             └──1:N── weekly_training_summary                 🆕

knowledge_base ──1:1── vector_index ──N:1── (向量数据库)      🆕
exercise ──1:1── vector_index                                 🆕
```

---

## 十、附录

### A. MySQL 初始化脚本位置

```
/sql
├── 00_schema.sql          # 建表语句(完整版)
├── 01_seed_data.sql       # 初始数据(部位、动作、成就、预设计划)
├── 02_index_optimize.sql  # 索引优化
└── 03_knowledge_seed.sql  # 🆕 训练知识库初始数据
```

### B. 小程序配置要求

- `project.config.json` 中开启云开发
- `app.json` 注册所有页面路由
- 配置合法域名：云开发 API 域名

### C. 云开发环境规划

| 环境 | 用途 | MySQL 实例 |
|------|------|-----------|
| dev | 开发测试 | 开发库 |
| prod | 生产环境 | 生产库 |

---

> **文档维护**: 需求变更时更新本文档并标注变更记录。  
> **联系方式**: [待填写]

---

## 十一、项目进度总结

> **更新时间**: 2026-05-28  
> **本次更新**: 新增 AI 对话式健身助手、AI 个性化训练计划生成模块

### 已完成功能 (MVP + 增强功能)

| 模块 | 功能点 | 备注 |
|------|--------|------|
| **用户模块** | 微信登录、个人信息设置、个人主页 | 用户体系完整 |
| **训练计划** | 计划列表、计划详情、系统预设计划 | 支持按目标/难度筛选 |
| **训练计划** | 自定义计划创建 | 可视化编辑器，支持多天数安排 |
| **训练计划** | 计划日历视图 | 周视图展示，支持快速跳转 |
| **动作库** | 动作列表、动作详情、部位筛选、搜索 | 包含演示图和说明 |
| **动作库** | 收藏动作功能 | 支持收藏/取消收藏，收藏列表 |
| **训练记录** | 开始训练、组间计时、逐组记录、完成训练 | 支持自由训练和计划训练 |
| **训练记录** | PR记录(个人最佳) | 最大重量/次数/容量记录 |
| **历史统计** | 训练历史列表、统计数据 | 周/月统计 |
| **身体数据** | 体重/体脂/体围记录、趋势图表 | 支持多指标切换 |
| **身体数据** | 里程碑自动标记 | 目标达成、减重/增重里程碑 |
| **打卡系统** | 每日打卡、连续天数统计 | 首页展示 |
| **打卡系统** | 成就徽章系统 | 多分类成就，进度追踪 |

### 待开发功能

| 模块 | 功能点 | 优先级 | 状态 |
|------|--------|--------|------|
| **训练计划** | 计划切换/暂停 | P1 | ⏳ 待开发 |
| **打卡系统** | 训练提醒 | P1 | ⏳ 待开发 |
| **社区模块** | 训练分享、动态流、点赞评论 | P2 | ⏳ 待开发 |
| **AI 对话助手** 🆕 | RAG 知识召回、多轮对话、用户画像记忆 | P0 | ⏳ 待开发 |
| **AI 对话助手** 🆕 | 结构化卡片输出、对话历史、安全过滤 | P1 | ⏳ 待开发 |
| **AI 计划生成** 🆕 | 个性化周计划生成、计划可解释 | P0 | ⏳ 待开发 |
| **AI 计划生成** 🆕 | 动态微调(完成率/RPE)、负荷追踪 | P1 | ⏳ 待开发 |

### 技术债务 & 优化项

| 项目 | 说明 | 优先级 |
|------|------|--------|
| 代码重构 | 云函数 SQL 查询优化 | 中 |
| 性能优化 | 图片懒加载、数据分页 | 中 |
| 单元测试 | 云函数测试覆盖 | 低 |
| 文档完善 | API 接口文档补充 | 低 |

### 已知问题

| 问题 | 状态 | 备注 |
|------|------|------|
| 部分组件 wxss 选择器警告 | ✅ 已修复 | 替换为 class 选择器 |
| MySQL LIMIT/OFFSET 参数绑定 | ✅ 已修复 | 使用字符串拼接 |
| GROUP BY 语法兼容 | ✅ 已修复 | 补充完整分组字段 |
| 数据返回格式处理 | ✅ 已修复 | 统一 callFunction 响应处理 |
