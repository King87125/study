import { Request, Response } from 'express';
import Friendship, { FriendshipStatus } from '../models/Friendship';
import { Op } from 'sequelize';  // 添加Op导入
import User from '../models/User';  // 导入User模型
// 这里不再导入User模型，使用模拟数据

// 获取用户的所有好友(已接受)
export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // 查询用户作为请求者的好友关系
    const asRequester = await Friendship.findAll({
      where: { 
        requesterId: userId,
        status: FriendshipStatus.ACCEPTED
      }
    });
    
    // 查询用户作为接收者的好友关系
    const asRecipient = await Friendship.findAll({
      where: { 
        recipientId: userId,
        status: FriendshipStatus.ACCEPTED
      }
    });
    
    // 获取所有朋友的ID
    const friendIds = [
      ...asRequester.map(f => f.recipientId),
      ...asRecipient.map(f => f.requesterId)
    ];
    
    // 查询所有朋友的用户信息
    const friendUsers = await User.findAll({
      where: { 
        id: { [Op.in]: friendIds } 
      },
      attributes: ['id', 'username', 'email', 'avatar']
    });
    
    // 合并好友关系和用户信息
    const friends = friendUsers.map(user => {
      // 查找对应的好友关系记录
      const friendship = 
        asRequester.find(f => f.recipientId === user.id) || 
        asRecipient.find(f => f.requesterId === user.id);
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: 'friend',
        since: friendship ? friendship.updatedAt : new Date()
      };
    });
    
    res.json(friends);
  } catch (error) {
    console.error('获取好友列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取待处理的好友请求
export const getFriendRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    console.log('获取好友请求，用户ID:', userId);
    
    // 查询发送给当前用户的待处理好友请求
    const pendingRequests = await Friendship.findAll({
      where: { 
        recipientId: userId,
        status: FriendshipStatus.PENDING
      }
    });
    
    console.log('待处理好友请求数量:', pendingRequests.length);
    
    if (pendingRequests.length === 0) {
      console.log('用户没有待处理的好友请求');
      return res.json([]);
    }
    
    console.log('待处理好友请求:', JSON.stringify(pendingRequests, null, 2));
    
    // 获取所有请求者的ID
    const requesterIds = pendingRequests.map(r => r.requesterId);
    console.log('请求者ID列表:', requesterIds);
    
    // 查询所有请求者的用户信息
    const requesterUsers = await User.findAll({
      where: { 
        id: { [Op.in]: requesterIds } 
      },
      attributes: ['id', 'username', 'email', 'avatar']
    });
    
    console.log('请求者用户信息:', JSON.stringify(requesterUsers, null, 2));
    
    // 合并请求和用户信息
    const requests = pendingRequests.map(request => {
      const requester = requesterUsers.find(u => u.id === request.requesterId);
      
      return {
        id: request.id,
        requesterId: request.requesterId,
        requesterName: requester ? requester.username : `用户${request.requesterId}`,
        requesterAvatar: requester ? requester.avatar : null,
        createdAt: request.createdAt
      };
    });
    
    console.log('返回的好友请求数据格式:', JSON.stringify(requests, null, 2));
    
    return res.json(requests);
  } catch (error) {
    console.error('获取好友请求错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 发送好友请求
export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { recipientId } = req.body;
    
    console.log('发送好友请求：', {
      发送者ID: userId,
      接收者ID: recipientId,
      接收者ID类型: typeof recipientId
    });
    
    if (!recipientId) {
      return res.status(400).json({ message: '请提供接收者ID' });
    }
    
    // 确保recipientId是数字
    const numericRecipientId = Number(recipientId);
    console.log('转换后的接收者ID:', numericRecipientId);
    
    if (isNaN(numericRecipientId)) {
      return res.status(400).json({ message: '接收者ID必须是数字' });
    }
    
    if (userId === numericRecipientId) {
      return res.status(400).json({ message: '不能添加自己为好友' });
    }
    
    // 检查是否已经存在好友关系
    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requesterId: userId, recipientId: numericRecipientId },
          { requesterId: numericRecipientId, recipientId: userId }
        ]
      }
    });
    
    console.log('已存在的好友关系:', existingFriendship);
    
    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        return res.status(400).json({ message: '你们已经是好友了' });
      }
      
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        return res.status(400).json({ message: '好友请求已经发送，等待对方接受' });
      }
      
      if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        return res.status(400).json({ message: '无法发送好友请求' });
      }
    }
    
    // 创建新的好友请求
    const friendship = await Friendship.create({
      requesterId: userId,
      recipientId: numericRecipientId,
      status: FriendshipStatus.PENDING
    });
    
    console.log('创建的好友请求:', JSON.stringify(friendship, null, 2));
    
    res.status(201).json({
      message: '好友请求已发送',
      friendship
    });
  } catch (error) {
    console.error('发送好友请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 接受好友请求
export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.params;
    
    // 查找并验证好友请求
    const friendship = await Friendship.findOne({
      where: { 
        id: parseInt(requestId),
        recipientId: userId,
        status: FriendshipStatus.PENDING
      }
    });
    
    if (!friendship) {
      return res.status(404).json({ message: '好友请求不存在或已处理' });
    }
    
    // 更新好友关系状态为已接受
    await Friendship.update(
      { status: FriendshipStatus.ACCEPTED },
      { where: { id: friendship.id } }
    );
    
    res.json({ message: '已接受好友请求' });
  } catch (error) {
    console.error('接受好友请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 拒绝好友请求
export const rejectFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.params;
    
    // 查找并验证好友请求
    const friendship = await Friendship.findOne({
      where: { 
        id: parseInt(requestId),
        recipientId: userId,
        status: FriendshipStatus.PENDING
      }
    });
    
    if (!friendship) {
      return res.status(404).json({ message: '好友请求不存在或已处理' });
    }
    
    // 更新好友关系状态为已拒绝
    await Friendship.update(
      { status: FriendshipStatus.REJECTED },
      { where: { id: friendship.id } }
    );
    
    res.json({ message: '已拒绝好友请求' });
  } catch (error) {
    console.error('拒绝好友请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除好友
export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { friendId } = req.params;
    
    // 删除好友关系
    await Friendship.destroy({
      where: {
        [Op.or]: [  // 修正语法，使用[Op.or]替代$or
          { requesterId: userId, recipientId: friendId, status: FriendshipStatus.ACCEPTED },
          { requesterId: friendId, recipientId: userId, status: FriendshipStatus.ACCEPTED }
        ]
      }
    });
    
    res.json({ message: '好友已删除' });
  } catch (error) {
    console.error('删除好友错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 搜索用户
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    const userId = (req as any).user.id;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: '请提供搜索关键词' });
    }
    
    console.log('搜索用户，关键词:', query, '当前用户ID:', userId);
    
    // 从数据库中查询用户
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId },  // 不包括当前用户
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'username', 'email', 'avatar'],  // 只返回这些字段
      limit: 10  // 限制结果数量
    });
    
    console.log('搜索结果:', users);
    
    res.json(users);
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({ message: '搜索用户失败' });
  }
}; 