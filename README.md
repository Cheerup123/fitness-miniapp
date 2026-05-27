# 运动健身助手微信小程序

基于微信小程序 + 微信云开发 (Cloudbase) + MySQL 的运动健身助手应用。

## 功能特性

- 🏋️ **训练计划** — 系统推荐 + 自定义创建，支持按周/天编排
- 💪 **运动动作库** — 丰富动作库，按部位/类型筛选，含动作要领
- 📊 **训练记录** — 逐组记录重量/次数，组间休息倒计时，自动统计
- 📈 **身体数据** — 体重/体脂/体围趋势图表，BMI 自动计算
- 🎯 **打卡系统** — 每日打卡，连续天数激励，成就徽章
- 👤 **个人中心** — 资料编辑、训练统计、历史查看

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生微信小程序 + Vant Weapp |
| 后端 | 微信云函数 (Node.js) |
| 数据库 | 云开发 MySQL (SQL 型) |
| 存储 | 云开发云存储 (COS) |

## 项目结构

```
fitness-miniapp/
├── project.config.json          # 项目配置
├── miniprogram/                 # 小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── pages/
│   │   ├── index/               # 首页
│   │   ├── plan/                # 训练计划 (list, detail)
│   │   ├── workout/             # 训练 (start, history, summary)
│   │   ├── exercise/            # 动作库 (list, detail)
│   │   ├── body/                # 身体数据 (index, record)
│   │   └── profile/             # 个人中心 (index, edit)
│   ├── components/              # 公共组件
│   │   ├── exercise-card/
│   │   ├── timer/
│   │   ├── stat-card/
│   │   └── empty-state/
│   └── utils/                   # 工具函数
├── cloudfunctions/              # 云函数
│   ├── db/                      # 数据库连接池(共享)
│   ├── user-login/
│   ├── user-update/
│   ├── plan-list/
│   ├── plan-detail/
│   ├── workout-start/
│   ├── workout-log-set/
│   ├── workout-complete/
│   ├── workout-history/
│   ├── exercise-list/
│   ├── exercise-detail/
│   ├── body-record/
│   ├── body-stats/
│   └── checkin-daily/
└── sql/                         # 数据库脚本
    ├── 00_schema.sql            # 建表语句
    └── 01_seed_data.sql         # 初始数据
```

## 快速开始

### 1. 前置条件

- 微信开发者工具 (最新版)
- 微信小程序账号 (已开通云开发)
- 云开发环境已开通 **MySQL** 数据库

### 2. 导入项目

1. 打开微信开发者工具
2. 选择「导入项目」
3. 项目目录选择 `fitness-miniapp/`
4. AppID 填入你的小程序 AppID
5. 点击「导入」

### 3. 配置云开发

1. 在开发者工具中点击「云开发」按钮
2. 开通云开发环境
3. 记下环境 ID，修改 `miniprogram/app.js` 中的 `env` 值：
   ```javascript
   wx.cloud.init({
     env: 'your-env-id',  // 替换为你的环境ID
   });
   ```

### 4. 初始化数据库

1. 在云开发控制台 → 数据库 → MySQL
2. 执行 `sql/00_schema.sql` 创建表结构
3. 执行 `sql/01_seed_data.sql` 导入初始数据

### 5. 部署云函数

在开发者工具中，右键点击 `cloudfunctions/` 下每个云函数目录：
- 选择「上传并部署：云端安装依赖」

需要部署的云函数：
- `db` (先部署，其他函数依赖它)
- `user-login`
- `user-update`
- `plan-list`
- `plan-detail`
- `workout-start`
- `workout-log-set`
- `workout-complete`
- `workout-history`
- `exercise-list`
- `exercise-detail`
- `body-record`
- `body-stats`
- `checkin-daily`

### 6. 安装 Vant Weapp 组件库

在 `miniprogram/` 目录下执行：

```bash
npm init -y
npm i @vant/weapp -S --production
```

然后在开发者工具中：工具 → 构建 npm

### 7. 运行

点击开发者工具中的「编译」即可预览。

## 数据库配置

云函数通过 `cloudfunctions/db/index.js` 共享 MySQL 连接池。需配置以下环境变量（在云开发控制台设置）：

| 变量名 | 说明 |
|--------|------|
| `MYSQL_HOST` | MySQL 内网地址 |
| `MYSQL_USER` | 数据库用户名 |
| `MYSQL_PASSWORD` | 数据库密码 |
| `MYSQL_DATABASE` | 数据库名 |

## 页面说明

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | `pages/index/index` | 今日计划、本周概览、快速入口 |
| 计划列表 | `pages/plan/list` | 浏览/搜索训练计划 |
| 计划详情 | `pages/plan/detail` | 查看计划详情，开始训练 |
| 训练执行 | `pages/workout/start` | 逐组记录、计时、休息倒计时 |
| 训练历史 | `pages/workout/history` | 按月查看训练记录 |
| 训练完成 | `pages/workout/summary` | 本次训练数据汇总 |
| 动作库 | `pages/exercise/list` | 按部位/类型筛选动作 |
| 动作详情 | `pages/exercise/detail` | 动作演示、步骤、要领 |
| 身体数据 | `pages/body/index` | 体重/体脂趋势图表 |
| 记录数据 | `pages/body/record` | 记录体重/体脂/体围 |
| 个人中心 | `pages/profile/index` | 统计、菜单入口 |
| 编辑资料 | `pages/profile/edit` | 个人信息、健身目标设置 |

## 设计规范

- **主色**: `#FF6B35` (活力橙)
- **辅助色**: `#1A1A2E` (深蓝黑)
- **背景色**: `#F5F5FA`
- **成功色**: `#4CAF50`
- **圆角**: 16rpx (卡片) / 8rpx (按钮)

## 注意事项

- 训练执行页面会保持屏幕常亮
- 组间休息结束时手机会震动提示
- 所有云函数使用参数化查询防止 SQL 注入
- 用户数据通过 openid 隔离，确保数据安全
