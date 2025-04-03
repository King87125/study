import { Request, Response } from 'express';
import { db } from '../db';
import jwt from 'jsonwebtoken';

// 获取用户的学习计划
export const getUserStudyPlans = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    
    // 获取用户的所有学习计划
    const studyPlans = await db.all(`
      SELECT 
        sp.id, 
        sp.user_id as userId, 
        sp.date, 
        sp.type, 
        sp.resource_id as resourceId, 
        sp.notes, 
        sp.priority, 
        sp.completed,
        CASE 
          WHEN sp.type = 'video' THEN v.title 
          WHEN sp.type = 'material' THEN m.title 
          ELSE NULL 
        END as title,
        CASE 
          WHEN sp.type = 'video' THEN v.url 
          WHEN sp.type = 'material' THEN m.fileUrl 
          ELSE NULL 
        END as resourceUrl,
        CASE 
          WHEN sp.type = 'video' THEN v.thumbnailUrl 
          ELSE NULL 
        END as thumbnail
      FROM study_plans sp
      LEFT JOIN Videos v ON sp.type = 'video' AND sp.resource_id = v.id
      LEFT JOIN Materials m ON sp.type = 'material' AND sp.resource_id = m.id
      WHERE sp.user_id = ?
      ORDER BY sp.date ASC, sp.priority DESC
    `, [userId]);

    res.status(200).json(studyPlans);
  } catch (error) {
    console.error('获取学习计划失败:', error);
    res.status(500).json({ message: '获取学习计划失败' });
  }
};

// 添加学习计划
export const addStudyPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { date, type, resourceId, priority, notes } = req.body;

    // 验证资源是否存在
    let resourceExists = false;
    if (type === 'video') {
      const video = await db.get('SELECT id FROM Videos WHERE id = ?', [resourceId]);
      resourceExists = !!video;
    } else if (type === 'material') {
      const material = await db.get('SELECT id FROM Materials WHERE id = ?', [resourceId]);
      resourceExists = !!material;
    }

    if (!resourceExists) {
      return res.status(404).json({ message: '所选资源不存在' });
    }

    // 插入学习计划
    const result = await db.run(`
      INSERT INTO study_plans (user_id, date, type, resource_id, priority, notes, completed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, date, type, resourceId, priority, notes || '', false]);

    // 查询新添加的计划
    const newPlan = await db.get(`
      SELECT 
        sp.id, 
        sp.user_id as userId, 
        sp.date, 
        sp.type, 
        sp.resource_id as resourceId, 
        sp.notes, 
        sp.priority, 
        sp.completed,
        CASE 
          WHEN sp.type = 'video' THEN v.title 
          WHEN sp.type = 'material' THEN m.title 
          ELSE NULL 
        END as title
      FROM study_plans sp
      LEFT JOIN Videos v ON sp.type = 'video' AND sp.resource_id = v.id
      LEFT JOIN Materials m ON sp.type = 'material' AND sp.resource_id = m.id
      WHERE sp.id = ?
    `, [result.lastID]);

    res.status(201).json(newPlan);
  } catch (error) {
    console.error('添加学习计划失败:', error);
    res.status(500).json({ message: '添加学习计划失败' });
  }
};

// 更新学习计划
export const updateStudyPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const planId = req.params.id;
    const { date, type, resourceId, priority, notes, completed } = req.body;

    // 检查计划是否存在且属于当前用户
    const existingPlan = await db.get('SELECT * FROM study_plans WHERE id = ? AND user_id = ?', [planId, userId]);
    if (!existingPlan) {
      return res.status(404).json({ message: '学习计划不存在或无权修改' });
    }

    // 验证资源是否存在
    let resourceExists = false;
    if (type === 'video') {
      const video = await db.get('SELECT id FROM Videos WHERE id = ?', [resourceId]);
      resourceExists = !!video;
    } else if (type === 'material') {
      const material = await db.get('SELECT id FROM Materials WHERE id = ?', [resourceId]);
      resourceExists = !!material;
    }

    if (!resourceExists) {
      return res.status(404).json({ message: '所选资源不存在' });
    }

    // 更新学习计划
    await db.run(`
      UPDATE study_plans 
      SET date = ?, type = ?, resource_id = ?, priority = ?, notes = ?, completed = ?
      WHERE id = ? AND user_id = ?
    `, [date, type, resourceId, priority, notes || '', completed || false, planId, userId]);

    // 查询更新后的计划
    const updatedPlan = await db.get(`
      SELECT 
        sp.id, 
        sp.user_id as userId, 
        sp.date, 
        sp.type, 
        sp.resource_id as resourceId, 
        sp.notes, 
        sp.priority, 
        sp.completed,
        CASE 
          WHEN sp.type = 'video' THEN v.title 
          WHEN sp.type = 'material' THEN m.title 
          ELSE NULL 
        END as title
      FROM study_plans sp
      LEFT JOIN Videos v ON sp.type = 'video' AND sp.resource_id = v.id
      LEFT JOIN Materials m ON sp.type = 'material' AND sp.resource_id = m.id
      WHERE sp.id = ?
    `, [planId]);

    res.status(200).json(updatedPlan);
  } catch (error) {
    console.error('更新学习计划失败:', error);
    res.status(500).json({ message: '更新学习计划失败' });
  }
};

// 删除学习计划
export const deleteStudyPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const planId = req.params.id;

    // 检查计划是否存在且属于当前用户
    const existingPlan = await db.get('SELECT * FROM study_plans WHERE id = ? AND user_id = ?', [planId, userId]);
    if (!existingPlan) {
      return res.status(404).json({ message: '学习计划不存在或无权删除' });
    }

    // 删除学习计划
    await db.run('DELETE FROM study_plans WHERE id = ? AND user_id = ?', [planId, userId]);

    res.status(200).json({ message: '学习计划删除成功' });
  } catch (error) {
    console.error('删除学习计划失败:', error);
    res.status(500).json({ message: '删除学习计划失败' });
  }
};

// 切换学习计划完成状态
export const togglePlanCompletion = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const planId = req.params.id;

    // 检查计划是否存在且属于当前用户
    const existingPlan = await db.get('SELECT * FROM study_plans WHERE id = ? AND user_id = ?', [planId, userId]);
    if (!existingPlan) {
      return res.status(404).json({ message: '学习计划不存在或无权修改' });
    }

    // 切换完成状态
    const newStatus = existingPlan.completed ? 0 : 1;
    await db.run('UPDATE study_plans SET completed = ? WHERE id = ?', [newStatus, planId]);

    res.status(200).json({ 
      id: existingPlan.id,
      completed: !!newStatus
    });
  } catch (error) {
    console.error('更新计划状态失败:', error);
    res.status(500).json({ message: '更新计划状态失败' });
  }
};

// ===== 管理员功能 =====

// 获取所有用户
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // 检查是否为管理员
    const admin = await db.get('SELECT is_admin FROM Users WHERE id = ?', [req.userId]);
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    const users = await db.all(`
      SELECT id, username, email, createdAt, is_admin as isAdmin
      FROM Users
      ORDER BY id
    `);

    res.status(200).json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
};

// 检查管理员权限
export const checkAdminStatus = async (req: Request, res: Response) => {
  try {
    const admin = await db.get('SELECT is_admin FROM Users WHERE id = ?', [req.userId]);
    res.status(200).json({ isAdmin: admin?.is_admin || false });
  } catch (error) {
    console.error('检查管理员权限失败:', error);
    res.status(500).json({ message: '检查管理员权限失败' });
  }
};

// 获取特定用户的学习计划
export const getUserPlansAsAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // 检查是否为管理员
    const admin = await db.get('SELECT is_admin FROM Users WHERE id = ?', [req.userId]);
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    // 获取用户的所有学习计划
    const studyPlans = await db.all(`
      SELECT 
        sp.id, 
        sp.user_id as userId, 
        sp.date, 
        sp.type, 
        sp.resource_id as resourceId, 
        sp.notes, 
        sp.priority, 
        sp.completed,
        CASE 
          WHEN sp.type = 'video' THEN v.title 
          WHEN sp.type = 'material' THEN m.title 
          ELSE NULL 
        END as title
      FROM study_plans sp
      LEFT JOIN Videos v ON sp.type = 'video' AND sp.resource_id = v.id
      LEFT JOIN Materials m ON sp.type = 'material' AND sp.resource_id = m.id
      WHERE sp.user_id = ?
      ORDER BY sp.date ASC, sp.priority DESC
    `, [userId]);

    res.status(200).json(studyPlans);
  } catch (error) {
    console.error('获取用户学习计划失败:', error);
    res.status(500).json({ message: '获取用户学习计划失败' });
  }
};

// 管理员添加学习计划
export const addStudyPlanAsAdmin = async (req: Request, res: Response) => {
  try {
    const { userId, date, type, resourceId, priority, notes } = req.body;

    // 检查是否为管理员
    const admin = await db.get('SELECT is_admin FROM Users WHERE id = ?', [req.userId]);
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    // 验证资源是否存在
    let resourceExists = false;
    if (type === 'video') {
      const video = await db.get('SELECT id FROM Videos WHERE id = ?', [resourceId]);
      resourceExists = !!video;
    } else if (type === 'material') {
      const material = await db.get('SELECT id FROM Materials WHERE id = ?', [resourceId]);
      resourceExists = !!material;
    }

    if (!resourceExists) {
      return res.status(404).json({ message: '所选资源不存在' });
    }

    // 插入学习计划
    const result = await db.run(`
      INSERT INTO study_plans (user_id, date, type, resource_id, priority, notes, completed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, date, type, resourceId, priority, notes || '', false]);

    // 查询新添加的计划
    const newPlan = await db.get(`
      SELECT 
        sp.id, 
        sp.user_id as userId, 
        sp.date, 
        sp.type, 
        sp.resource_id as resourceId, 
        sp.notes, 
        sp.priority, 
        sp.completed,
        CASE 
          WHEN sp.type = 'video' THEN v.title 
          WHEN sp.type = 'material' THEN m.title 
          ELSE NULL 
        END as title
      FROM study_plans sp
      LEFT JOIN Videos v ON sp.type = 'video' AND sp.resource_id = v.id
      LEFT JOIN Materials m ON sp.type = 'material' AND sp.resource_id = m.id
      WHERE sp.id = ?
    `, [result.lastID]);

    res.status(201).json(newPlan);
  } catch (error) {
    console.error('添加学习计划失败:', error);
    res.status(500).json({ message: '添加学习计划失败' });
  }
};

// 管理员删除学习计划
export const deleteStudyPlanAsAdmin = async (req: Request, res: Response) => {
  try {
    const planId = req.params.id;

    // 检查是否为管理员
    const admin = await db.get('SELECT is_admin FROM Users WHERE id = ?', [req.userId]);
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    // 检查计划是否存在
    const existingPlan = await db.get('SELECT * FROM study_plans WHERE id = ?', [planId]);
    if (!existingPlan) {
      return res.status(404).json({ message: '学习计划不存在' });
    }

    // 删除学习计划
    await db.run('DELETE FROM study_plans WHERE id = ?', [planId]);

    res.status(200).json({ message: '学习计划删除成功' });
  } catch (error) {
    console.error('删除学习计划失败:', error);
    res.status(500).json({ message: '删除学习计划失败' });
  }
};

// 获取所有学习计划 (管理员)
export const getAllStudyPlans = async (req: Request, res: Response) => {
  try {
    // 检查是否为管理员
    const admin = await db.get('SELECT is_admin FROM Users WHERE id = ?', [req.userId]);
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ message: '没有管理员权限' });
    }

    const studyPlans = await db.all(`
      SELECT 
        sp.id, sp.user_id as userId, u.username, sp.date, sp.type, 
        sp.resource_id as resourceId, sp.notes, sp.priority, sp.completed,
        CASE WHEN sp.type = 'video' THEN v.title WHEN sp.type = 'material' THEN m.title ELSE NULL END as title,
        CASE WHEN sp.type = 'video' THEN v.url WHEN sp.type = 'material' THEN m.fileUrl ELSE NULL END as resourceUrl,
        CASE WHEN sp.type = 'video' THEN v.thumbnailUrl ELSE NULL END as thumbnail,
        sp.created_at as createdAt
      FROM study_plans sp
      JOIN Users u ON sp.user_id = u.id 
      LEFT JOIN Videos v ON sp.type = 'video' AND sp.resource_id = v.id 
      LEFT JOIN Materials m ON sp.type = 'material' AND sp.resource_id = m.id 
      ORDER BY sp.created_at DESC
    `);

    res.status(200).json(studyPlans);
  } catch (error) {
    console.error('管理员获取所有学习计划失败:', error);
    res.status(500).json({ message: '管理员获取所有学习计划失败' });
  }
};