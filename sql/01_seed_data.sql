-- ============================================
-- 运动健身助手小程序 - 初始种子数据
-- ============================================

-- 身体部位
INSERT INTO `body_part` (`name`, `sort_order`) VALUES
('胸部', 1),
('背部', 2),
('肩部', 3),
('手臂', 4),
('腹部', 5),
('腿部', 6),
('臀部', 7),
('全身', 8);

-- 动作分类
INSERT INTO `exercise_category` (`name`, `parent_id`, `sort_order`) VALUES
('力量训练', NULL, 1),
('有氧运动', NULL, 2),
('拉伸放松', NULL, 3),
('徒手训练', NULL, 4),
('杠铃动作', 1, 1),
('哑铃动作', 1, 2),
('器械动作', 1, 3),
('绳索动作', 1, 4),
('自重动作', 1, 5);

-- 预设运动动作
INSERT INTO `exercise` (`name`, `name_en`, `category_id`, `difficulty`, `exercise_type`, `equipment`, `description`, `instructions`, `tips`, `calories_per_rep`, `is_compound`) VALUES
('平板卧推', 'Flat Bench Press', 5, 'intermediate', 'strength', 'barbell', '经典胸部训练动作，主要锻炼胸大肌', '["仰卧在平板凳上，双脚踩实地面","双手握住杠铃，握距略宽于肩","将杠铃缓慢下放至胸部上方","发力推起至手臂伸直，不要锁死肘关节"]', '["肩胛骨后缩下沉，挺胸","下放时吸气，推起时呼气","保持手腕中立位","控制节奏，不要借力弹胸"]', 0.35, 1),
('上斜哑铃卧推', 'Incline Dumbbell Press', 6, 'intermediate', 'strength', 'dumbbell', '针对上胸部的训练动作', '["将凳子调至30-45度角","双手各持一只哑铃，掌心朝前","缓慢下放哑铃至胸部两侧","发力推起至手臂伸直"]', '["不要耸肩，保持肩胛骨稳定","下放时肘部不要过度外展","控制重量，避免借力"]', 0.30, 1),
('哑铃飞鸟', 'Dumbbell Fly', 6, 'beginner', 'strength', 'dumbbell', '胸部孤立动作，拉伸胸大肌', '["仰卧在平板凳上，双手持哑铃","微屈肘部，双臂向两侧打开","感受胸部拉伸后夹胸合拢","保持肘部角度不变"]', '["肘部始终保持微屈","不要使用过重的重量","下放时感受胸肌拉伸"]', 0.25, 0),
('绳索下压', 'Cable Tricep Pushdown', 8, 'beginner', 'strength', 'cable', '三头肌经典训练动作', '["面对绳索架站立，双手握住绳索","大臂夹紧身体两侧不动","发力将绳索向下压至手臂伸直","缓慢回放至肘关节90度"]', '["大臂始终紧贴身体","不要借助身体摆动","顶峰收缩时充分挤压三头"]', 0.15, 0),
('引体向上', 'Pull-up', 9, 'intermediate', 'strength', 'none', '背部王牌动作，锻炼背阔肌', '["双手正握杠，握距略宽于肩","身体悬空，核心收紧","发力拉起身体至下巴过杠","缓慢下放至手臂完全伸直"]', '["不要借力摆动身体","拉起时集中背部发力","如果做不了可以用弹力带辅助"]', 0.50, 1),
('杠铃划船', 'Barbell Row', 5, 'intermediate', 'strength', 'barbell', '背部厚度训练核心动作', '["双脚与肩同宽，微屈膝","上半身前倾约45度","双手握住杠铃，拉向腹部","挤压背部后缓慢下放"]', '["保持背部挺直，不要弓背","拉起时肘部贴近身体","不要用腰部借力"]', 0.40, 1),
('哑铃侧平举', 'Dumbbell Lateral Raise', 6, 'beginner', 'strength', 'dumbbell', '三角肌中束孤立训练', '["站立，双手各持哑铃于体侧","微屈肘部，双臂向两侧抬起","抬至与肩平齐后缓慢下放","保持肩部稳定不要耸肩"]', '["不要使用过大重量","小指侧略高可更好刺激中束","控制下放速度"]', 0.12, 0),
('杠铃深蹲', 'Barbell Squat', 5, 'intermediate', 'strength', 'barbell', '腿部王牌动作，全身复合训练', '["杠铃置于斜方肌上，双脚略宽于肩","臀部后坐下蹲，膝盖跟随脚尖方向","蹲至大腿平行或略低于地面","脚跟发力站起"]', '["膝盖不要内扣","保持核心收紧，背部挺直","下蹲时吸气，站起时呼气"]', 0.60, 1),
('罗马尼亚硬拉', 'Romanian Deadlift', 5, 'intermediate', 'strength', 'barbell', '主要锻炼腘绳肌和臀部', '["双手握住杠铃，站距与肩同宽","保持背部挺直，臀部后推","杠铃沿大腿前方缓慢下放","感受腘绳肌拉伸后站起"]', '["膝盖微屈但不要过度弯曲","杠铃始终贴近身体","不要弓背，保持脊柱中立"]', 0.55, 1),
('平板支撑', 'Plank', 9, 'beginner', 'strength', 'none', '核心稳定性训练', '["俯卧，双肘撑地，脚尖着地","身体保持一条直线","收紧核心，不要塌腰或撅臀","保持呼吸，坚持规定时间"]', '["不要憋气","臀部不要抬太高","如果腰部酸痛立即停止"]', NULL, 0),
('卷腹', 'Crunch', 9, 'beginner', 'strength', 'none', '腹直肌基础训练动作', '["仰卧屈膝，双脚踩地","双手轻放耳侧或胸前","发力卷起上半身，感受腹肌收缩","缓慢下放，不要完全躺平"]', '["不要用手拉脖子","下背部始终贴紧地面","动作缓慢控制"]', 0.10, 0),
('跑步', 'Running', NULL, 'beginner', 'cardio', 'none', '基础有氧运动，燃脂效果好', '["选择合适的速度和坡度","保持正确跑姿：身体微前倾","手臂自然摆动","脚掌着地，步频保持稳定"]', '["跑步前做好热身","注意呼吸节奏","选择合适的跑鞋"]', NULL, 0),
('开合跳', 'Jumping Jack', 9, 'beginner', 'cardio', 'none', '全身热身和有氧动作', '["站立，双脚并拢，双手放体侧","跳起时双脚分开，双手举过头顶","再次跳起回到起始位置","保持节奏连续进行"]', '["着地时膝盖微屈缓冲","保持核心收紧","可以作为热身或HIIT动作"]', 0.15, 0),
('波比跳', 'Burpee', 9, 'advanced', 'cardio', 'none', '全身爆发力训练动作', '["站立位开始，下蹲双手撑地","双脚向后跳成俯卧撑位","做一个俯卧撑","双脚跳回，起身跳起"]', '["初学者可以省略俯卧撑","保持核心收紧","注意落地缓冲"]', 0.80, 1),
('哑铃弯举', 'Dumbbell Curl', 6, 'beginner', 'strength', 'dumbbell', '二头肌经典训练动作', '["站立，双手各持哑铃，掌心朝前","大臂不动，发力弯举哑铃","顶峰收缩后缓慢下放","保持身体稳定不要晃动"]', '["不要借助惯性甩起","大臂始终紧贴身体两侧","控制下放速度"]', 0.12, 0);

-- 动作-部位关联
INSERT INTO `exercise_body_part` (`exercise_id`, `body_part_id`, `is_primary`) VALUES
(1, 1, 1), (2, 1, 1), (3, 1, 1),
(4, 4, 1), (15, 4, 1),
(5, 2, 1), (6, 2, 1),
(7, 3, 1),
(8, 6, 1), (9, 6, 1), (9, 7, 1),
(10, 5, 1), (11, 5, 1),
(12, 8, 1), (13, 8, 1), (14, 8, 1);

-- 系统预设训练计划
INSERT INTO `workout_plan` (`name`, `description`, `difficulty_level`, `fitness_goal`, `duration_weeks`, `days_per_week`, `avg_duration_min`, `is_system`) VALUES
('新手入门增肌计划', '适合健身新手的4天分化训练计划，以复合动作为主，帮助建立基础力量和肌肉量', 'beginner', 'gain_muscle', 8, 4, 50, 1),
('减脂塑形计划', '结合力量训练和有氧运动，高效燃脂同时保持肌肉量', 'beginner', 'lose_fat', 8, 4, 45, 1),
('进阶增肌计划', '针对有一定基础的训练者，采用推拉腿分化，训练强度更高', 'intermediate', 'gain_muscle', 12, 5, 60, 1),
('居家徒手训练', '无需器械，在家即可完成的全身训练计划', 'beginner', 'keep_fit', 4, 3, 35, 1),
('力量提升计划', '以杠铃复合动作为核心，专注于力量增长', 'intermediate', 'gain_muscle', 8, 4, 55, 1);

-- 计划1：新手入门增肌计划 - 第1周
INSERT INTO `plan_day` (`plan_id`, `week_number`, `day_of_week`, `day_label`, `is_rest_day`, `sort_order`) VALUES
(1, 1, 1, '胸+三头', 0, 1),
(1, 1, 2, '休息日', 1, 2),
(1, 1, 3, '背+二头', 0, 3),
(1, 1, 4, '休息日', 1, 4),
(1, 1, 5, '肩+核心', 0, 5),
(1, 1, 6, '腿部', 0, 6),
(1, 1, 7, '休息日', 1, 7);

-- 计划1 - 胸+三头日动作
INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`, `notes`) VALUES
(1, 1, 4, '10-12', 90, 1, '注意肩胛骨后缩，挺胸'),
(1, 3, 3, '12-15', 60, 2, '感受胸部拉伸'),
(1, 2, 3, '10-12', 60, 3, '30-45度角'),
(1, 4, 3, '12-15', 60, 4, '大臂不动');

-- 计划1 - 背+二头日动作
INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`, `notes`) VALUES
(3, 5, 4, '6-10', 120, 1, '拉不到可以用弹力带辅助'),
(3, 6, 4, '10-12', 90, 2, '拉向腹部，挤压背部'),
(3, 15, 3, '10-12', 60, 3, '大臂不动，控制节奏');

-- 计划1 - 肩+核心日动作
INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`, `notes`) VALUES
(5, 7, 4, '12-15', 60, 1, '不要耸肩'),
(5, 10, 3, '30-45', 60, 2, '保持身体一条直线，单位秒'),
(5, 11, 3, '15-20', 45, 3, '下背部贴紧地面');

-- 计划1 - 腿部日动作
INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`, `notes`) VALUES
(6, 8, 4, '8-12', 120, 1, '蹲至大腿平行地面'),
(6, 9, 4, '10-12', 90, 2, '感受腘绳肌拉伸'),
(6, 13, 3, '15-20', 45, 3, '热身收尾');

-- 计划2：减脂塑形计划 - 第1周
INSERT INTO `plan_day` (`plan_id`, `week_number`, `day_of_week`, `day_label`, `is_rest_day`, `sort_order`) VALUES
(2, 1, 1, '上肢力量', 0, 1),
(2, 1, 2, '有氧+核心', 0, 2),
(2, 1, 3, '休息日', 1, 3),
(2, 1, 4, '下肢力量', 0, 4),
(2, 1, 5, '有氧+核心', 0, 5),
(2, 1, 6, '全身循环', 0, 6),
(2, 1, 7, '休息日', 1, 7);

-- 计划2 - 上肢力量日
INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`) VALUES
(8, 1, 3, '12', 60, 1),
(8, 5, 3, '8-10', 90, 2),
(8, 7, 3, '15', 45, 3),
(8, 15, 3, '12', 45, 4);

-- 计划2 - 有氧+核心日
INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`, `notes`) VALUES
(9, 12, 1, '1', 60, 1, '30分钟匀速跑'),
(9, 10, 3, '45', 30, 2, '单位秒'),
(9, 11, 3, '20', 30, 3, NULL);

-- 计划2 - 下肢力量日
INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`) VALUES
(11, 8, 4, '10-12', 90, 1),
(11, 9, 3, '12', 60, 2),
(11, 13, 3, '20', 45, 3);

-- 计划2 - 全身循环日
INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`) VALUES
(13, 14, 3, '10', 30, 1),
(13, 8, 3, '12', 30, 2),
(13, 1, 3, '12', 30, 3),
(13, 10, 3, '30', 30, 4);

-- 计划4：居家徒手训练 - 第1周
INSERT INTO `plan_day` (`plan_id`, `week_number`, `day_of_week`, `day_label`, `is_rest_day`, `sort_order`) VALUES
(4, 1, 1, '上肢+核心', 0, 1),
(4, 1, 3, '下肢+核心', 0, 2),
(4, 1, 5, '全身燃脂', 0, 3);

INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`, `notes`) VALUES
(15, 13, 3, '20', 30, 1, '热身'),
(15, 10, 3, '45', 45, 2, '单位秒'),
(15, 11, 3, '20', 30, 3, NULL);

INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`) VALUES
(16, 13, 3, '15', 30, 1),
(16, 8, 4, '15', 60, 2),
(16, 10, 3, '45', 45, 3);

INSERT INTO `plan_exercise` (`plan_day_id`, `exercise_id`, `sets`, `reps`, `rest_sec`, `sort_order`) VALUES
(17, 13, 3, '20', 20, 1),
(17, 14, 3, '10', 30, 2),
(17, 8, 3, '15', 30, 3),
(17, 11, 3, '20', 20, 4);

-- 成就配置
INSERT INTO `achievement` (`name`, `description`, `condition_type`, `condition_value`, `badge_color`, `sort_order`) VALUES
('初出茅庐', '完成第1次训练', 'total_workouts', 1, '#FF6B35', 1),
('坚持一周', '连续训练7天', 'streak_days', 7, '#4CAF50', 2),
('钢铁意志', '连续训练30天', 'streak_days', 30, '#2196F3', 3),
('训练达人', '累计完成50次训练', 'total_workouts', 50, '#9C27B0', 4),
('百炼成钢', '累计完成100次训练', 'total_workouts', 100, '#FF9800', 5),
('力量觉醒', '累计训练量达到10吨', 'total_volume', 10000, '#F44336', 6),
('钢铁之躯', '累计训练量达到100吨', 'total_volume', 100000, '#607D8B', 7),
('时间旅者', '累计训练时长达到1000分钟', 'total_duration', 1000, '#795548', 8),
('半程马拉松', '连续训练100天', 'streak_days', 100, '#E91E63', 9),
('传奇', '累计完成500次训练', 'total_workouts', 500, '#FFD700', 10);

-- 系统配置
INSERT INTO `sys_config` (`config_key`, `config_value`, `description`) VALUES
('app_version', '1.0.0', '当前版本号'),
('min_supported_version', '1.0.0', '最低支持版本'),
('rest_timer_default_sec', '60', '默认组间休息时间(秒)'),
('calorie_formula_version', '1', '卡路里计算公式版本');
