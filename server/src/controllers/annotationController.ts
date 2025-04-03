import { Request, Response } from 'express';
import Annotation from '../models/Annotation';
import Material from '../models/Material';

/**
 * 获取材料的所有标注
 * GET /api/materials/:materialId/annotations
 */
export const getAnnotations = async (req: Request, res: Response): Promise<void> => {
  try {
    const materialId = parseInt(req.params.materialId, 10);
    const userId = req.user?.id;
    const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined;

    // 验证材料是否存在
    const material = await Material.findByPk(materialId);
    if (!material) {
      res.status(404).json({ message: '材料不存在' });
      return;
    }

    // 构建查询条件
    const whereClause: any = {
      materialId,
      userId
    };

    // 如果指定了页码，只返回该页的标注
    if (pageNumber !== undefined) {
      whereClause.pageNumber = pageNumber;
    }

    // 查询标注
    const annotations = await Annotation.findAll({
      where: whereClause,
      order: [['pageNumber', 'ASC']]
    });

    res.status(200).json(annotations);
  } catch (error) {
    console.error('获取标注错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

/**
 * 创建新标注
 * POST /api/materials/:materialId/annotations
 */
export const createAnnotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const materialId = parseInt(req.params.materialId, 10);
    const userId = req.user?.id;
    const { annotationObjects, pageNumber } = req.body;

    // 验证材料是否存在
    const material = await Material.findByPk(materialId);
    if (!material) {
      res.status(404).json({ message: '材料不存在' });
      return;
    }

    // 验证必要字段
    if (!annotationObjects || pageNumber === undefined) {
      res.status(400).json({ message: '标注内容和页码都是必填字段' });
      return;
    }

    // 检查是否已有标注
    const existingAnnotation = await Annotation.findOne({
      where: {
        materialId,
        userId,
        pageNumber
      }
    });

    if (existingAnnotation) {
      // 更新现有标注
      existingAnnotation.annotationObjects = annotationObjects;
      await existingAnnotation.save();
      res.status(200).json(existingAnnotation);
    } else {
      // 创建新标注
      const newAnnotation = await Annotation.create({
        materialId,
        userId: userId as number,
        annotationObjects,
        pageNumber
      });

      res.status(201).json(newAnnotation);
    }
  } catch (error) {
    console.error('创建标注错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

/**
 * 更新标注
 * PUT /api/materials/:materialId/annotations/:annotationId
 */
export const updateAnnotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const annotationId = parseInt(req.params.annotationId, 10);
    const userId = req.user?.id;
    const { annotationObjects } = req.body;

    // 验证标注是否存在并属于当前用户
    const annotation = await Annotation.findOne({
      where: {
        id: annotationId,
        userId
      }
    });

    if (!annotation) {
      res.status(404).json({ message: '标注不存在或无权访问' });
      return;
    }

    // 更新标注
    annotation.annotationObjects = annotationObjects;
    await annotation.save();

    res.status(200).json(annotation);
  } catch (error) {
    console.error('更新标注错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

/**
 * 删除标注
 * DELETE /api/materials/:materialId/annotations/:annotationId
 */
export const deleteAnnotation = async (req: Request, res: Response): Promise<void> => {
  try {
    const annotationId = parseInt(req.params.annotationId, 10);
    const userId = req.user?.id;

    // 验证标注是否存在并属于当前用户
    const annotation = await Annotation.findOne({
      where: {
        id: annotationId,
        userId
      }
    });

    if (!annotation) {
      res.status(404).json({ message: '标注不存在或无权访问' });
      return;
    }

    // 删除标注
    await annotation.destroy();

    res.status(200).json({ message: '标注已删除' });
  } catch (error) {
    console.error('删除标注错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 