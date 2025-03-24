import { Request, Response } from 'express';
import Friendship, { FriendshipStatus } from '../models/Friendship';
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
    
    // 合并并格式化结果
    const friends = [
      ...asRequester.map(friendship => ({
        id: friendship.recipientId,
        username: `用户${friendship.recipientId}`, // 模拟用户名
        status: 'friend',
        since: friendship.updatedAt
      })),
      ...asRecipient.map(friendship => ({
        id: friendship.requesterId,
        username: `用户${friendship.requesterId}`, // 模拟用户名
        status: 'friend',
        since: friendship.updatedAt
      }))
    ];
    
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
    
    // 查询发送给当前用户的待处理好友请求
    const pendingRequests = await Friendship.findAll({
      where: { 
        recipientId: userId,
        status: FriendshipStatus.PENDING
      }
    });
    
    // 格式化结果
    const requests = pendingRequests.map(request => ({
      id: request.id,
      requesterId: request.requesterId,
      requesterName: `用户${request.requesterId}`, // 模拟用户名
      createdAt: request.createdAt
    }));
    
    res.json(requests);
  } catch (error) {
    console.error('获取好友请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 发送好友请求
export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: '请提供接收者ID' });
    }
    
    if (userId === recipientId) {
      return res.status(400).json({ message: '不能添加自己为好友' });
    }
    
    // 检查是否已经存在好友关系
    const existingFriendship = await Friendship.findOne({
      where: {
        $or: [
          { requesterId: userId, recipientId },
          { requesterId: recipientId, recipientId: userId }
        ]
      }
    });
    
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
      recipientId,
      status: FriendshipStatus.PENDING
    });
    
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
        $or: [
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
    const { query } = req.query;
    const userId = (req as any).user.id;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: '请提供搜索关键词' });
    }
    
    // 模拟搜索结果
    const users = [
      { id: 1, username: '张三', email: 'zhang@example.com' },
      { id: 2, username: '李四', email: 'li@example.com' },
      { id: 3, username: '王五', email: 'wang@example.com' }
    ].filter(user => 
      user.id !== userId && 
      (user.username.includes(query) || user.email.includes(query))
    );
    
    res.json(users);
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 